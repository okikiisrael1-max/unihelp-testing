import { useEffect, useState } from "react";

import imageCompression from "browser-image-compression";

import { toast } from "react-toastify";
import {
  ShoppingBag,
  Search,
  DollarSign,
  Phone,
  Loader2,
  PlusCircle,
  UploadCloud,
  X,
  Trash2,
  CheckCircle2,
  ImageIcon,
  Tag,
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
import { useNavigate } from "react-router-dom";
import { buildShareUrl, shareContent } from "../utils/share";

export default function StudentMarketplace({
  dark,
}) {
  /* =====================================================
     STATES
  ===================================================== */

  const [view, setView] =
    useState("market");

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filterCategory, setFilterCategory] =
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

  const [savedSpace, setSavedSpace] =
    useState(0);

  const [images, setImages] =
    useState([]);

  const [previews, setPreviews] =
    useState([]);

  const [isPremium, setIsPremium] =
    useState(false);

  const [uploadLimit, setUploadLimit] =
    useState(1);

  const [userUploads, setUserUploads] =
    useState(0);

  const [editingItem, setEditingItem] =
    useState(null);

  const [activeMenu, setActiveMenu] =
    useState(null);
  const navigate = useNavigate();
  const [form, setForm] =
    useState({
      title: "",
      category: "",
      price: "",
      phone: "",
      description: "",
    });

  /* =====================================================
     FETCH USER PLAN
  ===================================================== */

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
          const data =
            userSnap.data();

          const premium =
            data.premium ===
            true;

          setIsPremium(
            premium
          );

          setUploadLimit(
            premium ? 5 : 1
          );
        }

        const q = query(
          collection(
            db,
            "studentMarketplace"
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

  /* =====================================================
     FETCH ITEMS
  ===================================================== */

  const fetchItems = async () => {
    setLoading(true);

    try {
      let q =
        view === "market"
          ? query(
              collection(
                db,
                "studentMarketplace"
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
                "studentMarketplace"
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

      setItems(
        snap.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        )
      );
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    fetchUserPlan();
  }, [view]);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredItems =
    items.filter((item) => {
      const matchSearch =
        item.title
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        item.category
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchCategory =
        filterCategory
          ? item.category
              ?.toLowerCase()
              .includes(
                filterCategory.toLowerCase()
              )
          : true;

      const matchPrice =
        filterPrice
          ? Number(
              item.price
            ) <=
            Number(
              filterPrice
            )
          : true;

      return (
        matchSearch &&
        matchCategory &&
        matchPrice
      );
    });

  /* =====================================================
     IMAGE COMPRESSION
  ===================================================== */

  const compressImage =
    async (file) => {
      try {
        const options = {
          maxSizeMB: 0.5,
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

  /* =====================================================
     HANDLE IMAGES
  ===================================================== */

  const handleImages =
    async (files) => {
      if (!files.length)
        return;

      setCompressing(true);

      try {
        const selected =
          Array.from(files);

        const compressedFiles =
          [];

        const previewUrls =
          [];

        let original = 0;

        let compressed = 0;

        for (let file of selected) {
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

  /* =====================================================
     HANDLE UPLOAD / UPDATE
  ===================================================== */

  const handleUpload =
    async () => {
      if (!auth.currentUser) {
        toast.error("Please login first.");
        return;
      }

      if (
        !editingItem &&
        userUploads >=
          uploadLimit
      ) {
        toast.error(
          isPremium
            ? "Premium upload limit reached."
            : "Free users can upload only 1 listing."
        );
        return;
      }

      if (
        !form.title ||
        !form.category ||
        !form.price ||
        !form.phone
      ) {
        toast.error("Please fill all required fields.");
        return;
      }

      setUploading(true);

      try {
        let imageUrls =
          editingItem?.images ||
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
              console.error("Upload failed for image:", img.name, err);
              throw new Error(`Failed to upload ${img.name}`);
            }
          }
        }

        /* EDIT */

        if (
          editingItem
        ) {
          await updateDoc(
            doc(
              db,
              "studentMarketplace",
              editingItem.id
            ),
            {
              ...form,
              images:
                imageUrls,
            }
          );

          toast.success(
            "Listing updated successfully 🚀"
          );
        } else {
          /* NEW */

          await addDoc(
            collection(
              db,
              "studentMarketplace"
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

          toast.success(
            "Listing uploaded successfully 🚀"
          );
        }

        resetForm();

        fetchItems();

        fetchUserPlan();
      } catch (err) {
        console.log(err);

        toast.error(
          "Operation failed. Please try again."
        );
      }

      setUploading(false);
    };

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm =
    () => {
      setForm({
        title: "",
        category: "",
        price: "",
        phone: "",
        description: "",
      });

      setImages([]);

      setPreviews([]);

      setProgress(0);

      setEditingItem(
        null
      );

      setShowUpload(
        false
      );
    };

  /* =====================================================
     EDIT LISTING
  ===================================================== */

  const handleEdit =
    (item) => {
      setEditingItem(
        item
      );

      setForm({
        title:
          item.title || "",

        category:
          item.category ||
          "",

        price:
          item.price || "",

        phone:
          item.phone || "",

        description:
          item.description ||
          "",
      });

      setPreviews(
        item.images || []
      );

      setShowUpload(
        true
      );

      setActiveMenu(
        null
      );
    };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete =
    async (id) => {
      const confirmDelete =
        window.confirm(
          "Delete this listing?"
        );

      if (
        !confirmDelete
      )
        return;

      try {
        await deleteDoc(
          doc(
            db,
            "studentMarketplace",
            id
          )
        );

        setItems(
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

        toast.success(
          "Listing deleted successfully."
        );
      } catch (err) {
        console.log(err);
      }
    };

  /* =====================================================
     WHATSAPP
  ===================================================== */

  const openWhatsApp = (
    phone,
    title
  ) => {
    const cleanPhone =
      phone.replace(/\D/g, "");

    const message = `Hi, I'm interested in "${title}" from UniHelp Marketplace.`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  const shareProduct = async (item) => {
    const shareUrl = buildShareUrl("/studentmarketplace", {
      product: item.id,
    });

    try {
      await shareContent({
        title: item.title,
        text: `Check out this product on UniHelp: ${item.title}`,
        url: shareUrl,
      });

      if (!navigator.share) {
        toast.success("Product link copied to clipboard.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to share this product right now.");
    }
  };

  /* =====================================================
     STYLES
  ===================================================== */

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
            <div className="p-3 rounded-2xl bg-indigo-600 text-white">
              <ShoppingBag />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Student Marketplace
              </h1>

              <p className="text-sm opacity-70">
                Buy & Sell Easily
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
              <div onClick={()=>navigate('/premium')} className="cursor-pointer flex justify-between items-center gap-1">
                <Lock className="text-red-500" />

                <div>
                  <p className="font-semibold">
                    Free User
                  </p>

                  <p className="cursor-pointer text-xs opacity-70">
                    {userUploads}/1 upload
                  </p>
                </div>
              </div>
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
            My Products
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
                placeholder="Search products..."
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
              placeholder="Category"
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={
                filterCategory
              }
              onChange={(e) =>
                setFilterCategory(
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
              ? filteredItems
              : items
            ).map((item) => (
              <div
                key={item.id}
                className={`${card} rounded-2xl overflow-hidden`}
              >
                {/* IMAGE */}

                <div className="relative">
                  <img
                    src={
                      item.images?.[0]
                    }
                    className="h-56 w-full object-cover"
                    alt=""
                  />

                  {/* VERIFIED */}

                  {item.verified && (
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
                              item.id
                              ? null
                              : item.id
                          )
                        }
                        className="bg-black/60 text-white p-2 rounded-full"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenu ===
                        item.id && (
                        <div className="absolute right-0 mt-2 w-40 rounded-2xl overflow-hidden bg-[#111827] border border-white/10 shadow-2xl z-50">
                          <button
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-2 text-sm"
                          >
                            <Pencil size={15} />
                            Edit Product
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                item.id
                              )
                            }
                            className="w-full px-4 py-3 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-sm"
                          >
                            <Trash2 size={15} />
                            Delete Product
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* BODY */}

                <div className="p-4 space-y-3">

                  <div className="flex justify-between gap-3">
                    <h2 className="font-semibold text-lg">
                      {item.title}
                    </h2>

                    <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Tag size={11} />
                      {
                        item.category
                      }
                    </span>
                  </div>

                  <p className="text-sm opacity-70 line-clamp-2">
                    {
                      item.description
                    }
                  </p>

                  <p className="text-indigo-500 font-bold flex items-center gap-1">
                    <DollarSign size={15} />
                    ₦{item.price}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => shareProduct(item)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500/10 py-3 text-sm font-medium text-indigo-500"
                    >
                      <Share2 size={15} />
                      Share
                    </button>

                    {view === "market" ? (
                      <button
                        onClick={() =>
                          openWhatsApp(
                            item.phone,
                            item.title
                          )
                        }
                        className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
                      >
                        <Phone size={15} />
                        Chat on WhatsApp
                      </button>
                    ) : (
                      <p
                        className={`inline-flex flex-[1.2] items-center justify-center rounded-xl px-3 py-3 text-xs ${
                          item.status === "approved"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {item.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FLOAT */}

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
          <div className="fixed inset-0 bg-black/70 z-501 flex items-center justify-center px-4">
            <div
              className={`${card} w-full md:w-125 p-5 rounded-3xl max-h-[90vh] overflow-y-auto`}
            >
              {/* TOP */}

              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">
                  {editingItem
                    ? "Edit Product"
                    : "Upload Product"}
                </h2>

                <button
                  onClick={
                    resetForm
                  }
                >
                  <X />
                </button>
              </div>

              {/* FORM */}

              <div className="space-y-3">

                <input
                  placeholder="Product Title"
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
                  placeholder="Category"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={
                    form.category
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category:
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
                  rows={4}
                  placeholder="Description"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none resize-none"
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

                  <p className="font-medium">
                    Upload Images
                  </p>

                  <input
                    hidden
                    type="file"
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

                {/* PREVIEWS */}

                <div className="flex gap-3 overflow-x-auto">
                  {previews.map(
                    (
                      img,
                      i
                    ) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                    )
                  )}
                </div>

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
                  ) : editingItem ? (
                    "Update Product"
                  ) : (
                    "Publish Product"
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
