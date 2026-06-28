import { useEffect, useState } from "react";

import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";

import {
  Home,
  Search,
  MapPin,
  DollarSign,
  Phone,
  Loader2,
  PlusCircle,
  UploadCloud,
  X,
  Trash2,
  CheckCircle2,
  ImageIcon,
  Crown,
  Lock,
  Pencil,
  MoreVertical,
  Share2,
} from "lucide-react";

import {
  db,
  auth,
} from "../../firebase/config";

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { uploadImage } from "../../services/cloudinary";
import {Link} from 'react-router-dom'
import { buildShareUrl, shareContent } from "../utils/share";

export default function HostelMarketplace({
  dark,
}) {
  /* ======================================================
     STATES
  ====================================================== */

  const [view, setView] =
    useState("market");

  const [hostels, setHostels] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filterLocation, setFilterLocation] =
    useState("");

  const [filterPrice, setFilterPrice] =
    useState("");

  const [showUpload, setShowUpload] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [compressing, setCompressing] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [images, setImages] =
    useState([]);

  const [previews, setPreviews] =
    useState([]);

  const [savedSpace, setSavedSpace] =
    useState(0);

  const [editingHostel, setEditingHostel] =
    useState(null);

  const [activeMenu, setActiveMenu] =
    useState(null);

  const [isPremium, setIsPremium] =
    useState(false);

  const [uploadLimit, setUploadLimit] =
    useState(3);

  const [userUploads, setUserUploads] =
    useState(0);

  const [form, setForm] =
    useState({
      title: "",
      location: "",
      price: "",
      phone: "",
      description: "",
    });

  /* ======================================================
     FETCH USER PLAN
  ====================================================== */

  const fetchUserPlan =
    async () => {
      try {
        if (
          !auth.currentUser
        )
          return;

        const userRef = doc(
          db,
          "users",
          auth.currentUser.uid
        );

        const userSnap =
          await getDoc(
            userRef
          );

        if (
          userSnap.exists()
        ) {
          const userData =
            userSnap.data();

          const premium =
            userData.premium ===
            true;

          setIsPremium(
            premium
          );

          setUploadLimit(
            premium ? 5 : 3
          );
        }

        const q = query(
          collection(
            db,
            "hostels"
          ),
          where(
            "userId",
            "==",
            auth.currentUser.uid
          )
        );

        const snap =
          await getDocs(q);

        setUserUploads(
          snap.size
        );
      } catch (err) {
        console.log(err);
      }
    };

  /* ======================================================
     FETCH HOSTELS
  ====================================================== */

  const fetchHostels = async () => {
    setLoading(true);

    try {
      let q =
        view === "market"
          ? query(
              collection(
                db,
                "hostels"
              ),
              where(
                "status",
                "==",
                "approved"
              )
            )
          : query(
              collection(
                db,
                "hostels"
              ),
              where(
                "userId",
                "==",
                auth.currentUser
                  ?.uid
              )
            );

      const snap =
        await getDocs(q);

      setHostels(
        snap.docs.map(
          (d) => ({
            id: d.id,
            ...d.data(),
          })
        )
      );
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchHostels();

    fetchUserPlan();
  }, [view]);

  /* ======================================================
     FILTER
  ====================================================== */

  const filtered =
    hostels.filter((h) => {
      const matchSearch =
        (h.title || "")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        (h.location || "")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchLocation =
        filterLocation
          ? h.location
              ?.toLowerCase()
              .includes(
                filterLocation.toLowerCase()
              )
          : true;

      const matchPrice =
        filterPrice
          ? Number(
              h.price
            ) <=
            Number(
              filterPrice
            )
          : true;

      return (
        matchSearch &&
        matchLocation &&
        matchPrice
      );
    });

  /* ======================================================
     IMAGE COMPRESSION
  ====================================================== */

  const compressImage =
    async (file) => {
      try {
        const options = {
          maxSizeMB: 0.4,
          maxWidthOrHeight: 1400,
          useWebWorker: true,
          fileType:
            "image/webp",
        };

        return await imageCompression(
          file,
          options
        );
      } catch (err) {
        return file;
      }
    };

  /* ======================================================
     HANDLE IMAGES
  ====================================================== */

  const handleImages =
    async (files) => {
      if (!files.length)
        return;

      setCompressing(true);

      try {
        const arr =
          Array.from(files);

        const compressedFiles =
          [];

        const previewUrls =
          [];

        let original = 0;

        let compressed = 0;

        for (let file of arr) {
          original += file.size;

          const optimized =
            await compressImage(
              file
            );

          compressed +=
            optimized.size;

          compressedFiles.push(
            optimized
          );

          previewUrls.push(
            URL.createObjectURL(
              optimized
            )
          );
        }

        setSavedSpace(
          Math.round(
            ((original -
              compressed) /
              original) *
              100
          )
        );

        setImages(
          compressedFiles
        );

        setPreviews(
          previewUrls
        );
      } catch (err) {
        console.log(err);
      }

      setCompressing(false);
    };

  /* ======================================================
     RESET FORM
  ====================================================== */

  const resetForm =
    () => {
      setForm({
        title: "",
        location: "",
        price: "",
        phone: "",
        description: "",
      });

      setImages([]);

      setPreviews([]);

      setSavedSpace(0);

      setProgress(0);

      setEditingHostel(
        null
      );

      setShowUpload(
        false
      );
    };

  /* ======================================================
     UPLOAD / UPDATE
  ====================================================== */

  const handleUpload =
    async () => {
      if (!auth.currentUser)
        return alert(
          "Please login first"
        );

      if (
        !editingHostel &&
        userUploads >=
          uploadLimit
      ) {
        return alert(
          isPremium
            ? "Premium users can upload only 5 hostels."
            : "Free users can upload only 3 hostels."
        );
      }

      if (
        !form.title ||
        !form.location ||
        !form.price ||
        !form.phone
      ) {
        return alert(
          "All fields are required"
        );
      }

      setUploading(true);

      try {
        let imageUrls =
          editingHostel?.images ||
          [];

        /* UPLOAD NEW IMAGES TO CLOUDINARY */

        if (
          images.length > 0
        ) {
          imageUrls = [];

          for (let img of images) {
            try {
              const result = await uploadImage(img, (percent) => {
                setProgress(
                  Math.round(percent)
                );
              });

              imageUrls.push(
                result.secure_url
              );
            } catch (err) {
              console.error("Upload failed:", img.name, err);
              throw new Error(`Failed to upload ${img.name}`);
            }
          }
        }

        /* EDIT */

        if (
          editingHostel
        ) {
          await updateDoc(
            doc(
              db,
              "hostels",
              editingHostel.id
            ),
            {
              ...form,
              images:
                imageUrls,
            }
          );

          alert(
            "Hostel updated successfully 🚀"
          );
        } else {
          /* NEW */

          await addDoc(
            collection(
              db,
              "hostels"
            ),
            {
              ...form,

              images:
                imageUrls,

              userId:
                auth
                  .currentUser
                  .uid,

              createdAt:
                new Date(),

              status:
                "pending",

              verified:
                isPremium,

              premiumUser:
                isPremium,
            }
          );

          alert(
            "Hostel uploaded successfully 🚀"
          );
        }

        resetForm();

        fetchHostels();

        fetchUserPlan();
      } catch (err) {
        console.log(err);

        alert(
          "Operation failed"
        );
      }

      setUploading(false);
    };

  /* ======================================================
     EDIT HOSTEL
  ====================================================== */

  const handleEdit =
    (hostel) => {
      setEditingHostel(
        hostel
      );

      setForm({
        title:
          hostel.title ||
          "",

        location:
          hostel.location ||
          "",

        price:
          hostel.price ||
          "",

        phone:
          hostel.phone ||
          "",

        description:
          hostel.description ||
          "",
      });

      setPreviews(
        hostel.images || []
      );

      setShowUpload(
        true
      );

      setActiveMenu(
        null
      );
    };

  /* ======================================================
     DELETE
  ====================================================== */

  const handleDelete =
    async (id) => {
      const confirmDelete =
        window.confirm(
          "Delete this hostel?"
        );

      if (
        !confirmDelete
      )
        return;

      try {
        await deleteDoc(
          doc(
            db,
            "hostels",
            id
          )
        );

        setHostels(
          (
            prev
          ) =>
            prev.filter(
              (
                item
              ) =>
                item.id !==
                id
            )
        );

        fetchUserPlan();

        alert(
          "Hostel deleted"
        );
      } catch (err) {
        console.log(err);
      }
    };

  /* ======================================================
     WHATSAPP
  ====================================================== */

  const openWhatsApp = (
    phone,
    title
  ) => {
    const cleanPhone =
      phone.replace(/\D/g, "");

    const message = `Hi, I'm interested in "${title}" on UniHelp.`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  const shareHostel = async (hostel) => {
    const shareUrl = buildShareUrl("/hostelmarketplace", {
      hostel: hostel.id,
    });

    try {
      await shareContent({
        title: hostel.title,
        text: `Check out this hostel on UniHelp: ${hostel.title}`,
        url: shareUrl,
      });

      if (!navigator.share) {
        toast.success("Hostel link copied to clipboard.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to share this hostel right now.");
    }
  };

  /* ======================================================
     STYLES
  ====================================================== */

  const bg = dark
    ? "bg-[#0b0f1a] text-white"
    : "bg-[#f6f8fc] text-gray-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-gray-200 shadow-sm";

  return (
    <div
      className={`min-h-screen w-full md:pt-20 px-4 py-6 ${bg}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
              <Home />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Hostel Marketplace
              </h1>

              <p className="text-sm opacity-70">
                Find & manage student hostels
              </p>
            </div>
          </div>

          {/* PLAN */}

          <div
            className={`${card} px-4 py-3 rounded-2xl flex items-center gap-3`}
          >
            {isPremium ? (
              <>
                <Crown className="text-yellow-500" />

                <div>
                  <p className="font-semibold">
                    Premium User
                  </p>

                  <p className="text-xs opacity-70">
                    {userUploads}/5 uploads
                  </p>
                </div>
              </>
            ) : (
              <>
              <Link to={'/premium'} className='cursor-pointer flex gap-1 items-center' >
              <Lock className="text-red-500" />
                <div>
                  <p className="font-semibold">
                    Free User
                  </p>

                  <p className="text-xs opacity-70">
                    {userUploads}/3 uploads
                  </p>
                </div>
              </Link>
                
              </>
            )}
          </div>
        </div>

        {/* TOGGLE */}

        <div className="flex gap-3">
          <button
            onClick={() =>
              setView(
                "market"
              )
            }
            className={`px-5 py-2 rounded-xl ${
              view ===
              "market"
                ? "bg-indigo-600 text-white"
                : "bg-white/10"
            }`}
          >
            Marketplace
          </button>

          <button
            onClick={() =>
              setView("my")
            }
            className={`px-5 py-2 rounded-xl ${
              view === "my"
                ? "bg-indigo-600 text-white"
                : "bg-white/10"
            }`}
          >
            My Hostels
          </button>
        </div>

        {/* SEARCH */}

        {view ===
          "market" && (
          <div
            className={`${card} p-4 rounded-2xl grid md:grid-cols-3 gap-3`}
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5">
              <Search size={16} />

              <input
                placeholder="Search hostels..."
                className="bg-transparent outline-none w-full text-sm"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />
            </div>

            <input
              placeholder="Location"
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={
                filterLocation
              }
              onChange={(e) =>
                setFilterLocation(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Max price"
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={filterPrice}
              onChange={(e) =>
                setFilterPrice(
                  e.target.value
                )
              }
            />
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {(view ===
            "market"
              ? filtered
              : hostels
            ).map((h) => (
              <div
                key={h.id}
                className={`${card} rounded-2xl overflow-hidden`}
              >
                {/* IMAGE */}

                <div className="relative">
                  <img
                    src={
                      h.images?.[0]
                    }
                    className="h-56 w-full object-cover"
                    alt=""
                  />

                  {h.verified && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Verified
                    </div>
                  )}

                  {/* MENU */}

                  {view ===
                    "my" && (
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() =>
                          setActiveMenu(
                            activeMenu ===
                              h.id
                              ? null
                              : h.id
                          )
                        }
                        className="bg-black/60 text-white p-2 rounded-full"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenu ===
                        h.id && (
                        <div className="absolute right-0 mt-2 w-40 rounded-2xl overflow-hidden bg-[#111827] border border-white/10 shadow-2xl z-50">
                          <button
                            onClick={() =>
                              handleEdit(
                                h
                              )
                            }
                            className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-2 text-sm"
                          >
                            <Pencil size={15} />
                            Edit Hostel
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                h.id
                              )
                            }
                            className="w-full px-4 py-3 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-sm"
                          >
                            <Trash2 size={15} />
                            Delete Hostel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* BODY */}

                <div className="p-4 space-y-3">

                  <h2 className="font-semibold text-lg">
                    {h.title}
                  </h2>

                  <p className="text-sm opacity-70 line-clamp-2">
                    {
                      h.description
                    }
                  </p>

                  <p className="flex items-center gap-1 text-sm opacity-70">
                    <MapPin size={14} />
                    {h.location}
                  </p>

                  <p className="text-indigo-500 font-bold flex items-center gap-1">
                    <DollarSign size={14} />
                    ₦{h.price}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => shareHostel(h)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500/10 py-3 text-sm font-medium text-indigo-500"
                    >
                      <Share2 size={14} />
                      Share
                    </button>

                    {view === "market" ? (
                      <button
                        onClick={() =>
                          openWhatsApp(
                            h.phone,
                            h.title
                          )
                        }
                        className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
                      >
                        <Phone size={14} />
                        Chat on WhatsApp
                      </button>
                    ) : (
                      <p
                        className={`inline-flex flex-[1.2] items-center justify-center rounded-xl px-3 py-3 text-xs ${
                          h.status === "approved"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {h.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FLOAT BUTTON */}

        <button
          onClick={() => {
            resetForm();

            setShowUpload(
              true
            );
          }}
          className="fixed bottom-28 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition"
        >
          <PlusCircle />
        </button>

        {/* MODAL */}

        {showUpload && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div
              className={`${card} w-full max-w-xl p-5 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto`}
            >
              {/* HEADER */}

              <div className="flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2 text-lg">
                  <UploadCloud size={18} />
                  {editingHostel
                    ? "Edit Hostel"
                    : "Upload Hostel"}
                </h2>

                <X
                  className="cursor-pointer"
                  onClick={
                    resetForm
                  }
                />
              </div>

              {/* FORM */}

              <div className="space-y-3">

                <input
                  placeholder="Hostel Title"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title:
                        e.target
                          .value,
                    })
                  }
                />

                <input
                  placeholder="Location"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={
                    form.location
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location:
                        e.target
                          .value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Price"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price:
                        e.target
                          .value,
                    })
                  }
                />

                <input
                  placeholder="WhatsApp Number"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target
                          .value,
                    })
                  }
                />

                <textarea
                  placeholder="Short Description"
                  maxLength={
                    120
                  }
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 resize-none outline-none"
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target
                          .value,
                    })
                  }
                />

                {/* IMAGE */}

                <label className="border-2 border-dashed border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer">
                  <ImageIcon className="opacity-70 mb-2" />

                  <p className="text-sm font-medium">
                    Upload Hostel Images
                  </p>

                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      handleImages(
                        e.target
                          .files
                      )
                    }
                  />
                </label>

                {/* COMPRESS */}

                {compressing && (
                  <div className="text-sm text-indigo-500">
                    Compressing images...
                  </div>
                )}

                {savedSpace >
                  0 && (
                  <div className="text-sm text-green-500">
                    Saved{" "}
                    {
                      savedSpace
                    }
                    % storage space
                  </div>
                )}

                {/* PREVIEW */}

                <div className="flex gap-3 overflow-x-auto">
                  {previews.map(
                    (
                      img,
                      i
                    ) => (
                      <div
                        key={i}
                        className="relative min-w-[110px]"
                      >
                        <img
                          src={img}
                          className="h-24 w-28 object-cover rounded-xl"
                          alt=""
                        />

                        <button
                          onClick={() => {
                            setImages(
                              (
                                prev
                              ) =>
                                prev.filter(
                                  (
                                    _,
                                    index
                                  ) =>
                                    index !==
                                    i
                                )
                            );

                            setPreviews(
                              (
                                prev
                              ) =>
                                prev.filter(
                                  (
                                    _,
                                    index
                                  ) =>
                                    index !==
                                    i
                                )
                            );
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )
                  )}
                </div>

                {/* PROGRESS */}

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Uploading...
                      </span>

                      <span>
                        {
                          progress
                        }
                        %
                      </span>
                    </div>

                    <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${progress}%`,
                        }}
                        className="h-full bg-indigo-600 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* BUTTON */}

                <button
                  onClick={
                    handleUpload
                  }
                  disabled={
                    uploading
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="inline animate-spin mr-2" />
                      Processing...
                    </>
                  ) : editingHostel ? (
                    "Update Hostel"
                  ) : (
                    "Publish Hostel"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
