import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import ImageCarousel from "../components/ImageCarousel";
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

import { db, auth } from "../../firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { toCloudinaryAsset, uploadImage } from "../../services/cloudinary";
import { deleteMediaDocument } from "../../services/mediaCleanup";
import { buildShareUrl, shareContent } from "../utils/share";

export default function HostelMarketplace({ dark }) {
  const [view, setView] = useState("market");
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  // Upload Modal & Form
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [savedSpace, setSavedSpace] = useState(0);

  const [editingHostel, setEditingHostel] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  // Plan Limits
  const [isPremium, setIsPremium] = useState(false);
  const [uploadLimit, setUploadLimit] = useState(5);
  const [userUploads, setUserUploads] = useState(0);

  const [form, setForm] = useState({
    title: "",
    location: "",
    price: "",
    phone: "",
    description: "",
  });

  /* FETCH PLAN DATA */
  const fetchUserPlan = async () => {
    try {
      if (!auth.currentUser) return;

      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const premium = Boolean(userData.premium);
        setIsPremium(premium);
        setUploadLimit(premium ? 10 : 5);
      }

      const q = query(
        collection(db, "hostels"),
        where("userId", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      setUserUploads(snap.size);
    } catch (err) {
      console.error("Error fetching user plan:", err);
    }
  };

  /* FETCH HOSTELS */
  const fetchHostels = async () => {
    setLoading(true);
    try {
      const q =
        view === "market"
          ? query(collection(db, "hostels"))
          : query(
              collection(db, "hostels"),
              where("userId", "==", auth.currentUser?.uid || "")
            );

      const snap = await getDocs(q);
      setHostels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching hostels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
    fetchUserPlan();
  }, [view]);

  /* FILTERING */
  const filtered = hostels.filter((h) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (h.title || "").toLowerCase().includes(searchLower) ||
      (h.location || "").toLowerCase().includes(searchLower);

    const matchLocation = filterLocation
      ? (h.location || "").toLowerCase().includes(filterLocation.toLowerCase())
      : true;

    const matchPrice = filterPrice
      ? Number(h.price) <= Number(filterPrice)
      : true;

    return matchSearch && matchLocation && matchPrice;
  });

  /* IMAGE HANDLING & COMPRESSION */
  const compressImage = async (file) => {
    try {
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        fileType: "image/webp",
      };
      return await imageCompression(file, options);
    } catch {
      return file;
    }
  };

  const handleImages = async (files) => {
    if (!files || !files.length) return;
    setCompressing(true);

    try {
      const arr = Array.from(files);
      const compressedFiles = [];
      const previewUrls = [];
      let original = 0;
      let compressed = 0;

      for (const file of arr) {
        original += file.size;
        const optimized = await compressImage(file);
        compressed += optimized.size;
        compressedFiles.push(optimized);
        previewUrls.push(URL.createObjectURL(optimized));
      }

      setSavedSpace(
        original > 0
          ? Math.round(((original - compressed) / original) * 100)
          : 0
      );
      setImages(compressedFiles);
      setPreviews(previewUrls);
    } catch (err) {
      console.error("Error handling images:", err);
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index) => {
    setPreviews((prev) => {
      if (prev[index]?.startsWith("blob:")) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    previews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });

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
    setEditingHostel(null);
    setShowUpload(false);
  };

  /* UPLOAD & EDIT HANDLER */
  const handleUpload = async () => {
    if (!auth.currentUser) return alert("Please login first");

    if (!editingHostel && userUploads >= uploadLimit) {
      return alert(
        isPremium
          ? `Premium users are limited to ${uploadLimit} hostels.`
          : `Free users are limited to ${uploadLimit} hostels. Upgrade to Premium for higher limits!`
      );
    }

    if (!form.title || !form.location || !form.price || !form.phone) {
      return alert("All required fields must be filled out.");
    }

    setUploading(true);

    try {
      let imageUrls = editingHostel?.images || [];
      let imageAssets = editingHostel?.imageAssets || [];

      if (images.length > 0) {
        imageUrls = [];
        imageAssets = [];

        for (const img of images) {
          const result = await uploadImage(img, (percent) => {
            setProgress(Math.round(percent));
          });
          imageUrls.push(result.secure_url);
          imageAssets.push(toCloudinaryAsset(result));
        }
      }

      if (editingHostel) {
        await updateDoc(doc(db, "hostels", editingHostel.id), {
          ...form,
          images: imageUrls,
          imageAssets,
        });
        toast.success("Hostel updated successfully!");
      } else {
        await addDoc(collection(db, "hostels"), {
          ...form,
          images: imageUrls,
          imageAssets,
          userId: auth.currentUser.uid,
          createdAt: new Date(),
          status: "pending",
          verified: isPremium,
          premiumUser: isPremium,
        });
        toast.success("Hostel uploaded successfully!");
      }

      resetForm();
      fetchHostels();
      fetchUserPlan();
    } catch (err) {
      console.error(err);
      toast.error("Operation failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (hostel) => {
    setEditingHostel(hostel);
    setForm({
      title: hostel.title || "",
      location: hostel.location || "",
      price: hostel.price || "",
      phone: hostel.phone || "",
      description: hostel.description || "",
    });
    setPreviews(hostel.images || []);
    setShowUpload(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hostel?")) return;

    try {
      await deleteMediaDocument("hostels", id);
      setHostels((prev) => prev.filter((item) => item.id !== id));
      fetchUserPlan();
      toast.info("Hostel deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete hostel");
    }
  };

  const openWhatsApp = (phone, title) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = `Hi, I'm interested in "${title}" on UniHelp.`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
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
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to share this hostel right now.");
    }
  };

  /* STYLES */
  const bg = dark ? "bg-[#0b0f1a] text-white" : "bg-[#f6f8fc] text-gray-900";
  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-gray-200 shadow-sm";
  const inputBg = dark ? "bg-white/5" : "bg-black/5";

  return (
    <div className={`min-h-screen w-full md:pt-20 px-4 py-4 ${bg}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex max-md:flex-col-reverse gap-2.5 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
              <Home />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hostel Marketplace</h1>
              <p className="text-sm opacity-70">
                Find & manage student hostels
              </p>
            </div>
          </div>

          {/* PLAN BADGE */}
          <div className={`${card} px-4 py-3 max-md:ml-auto rounded-2xl flex items-center gap-3`}>
            {isPremium ? (
              <>
                <Crown className="text-yellow-500" />
                <div>
                  <p className="font-semibold text-sm">Premium User</p>
                  <p className="text-xs opacity-70">
                    {userUploads}/{uploadLimit} uploads
                  </p>
                </div>
              </>
            ) : (
              <Link to="/premium" className="flex items-center gap-2">
                <Lock className="text-red-500" />
                <div>
                  <p className="font-semibold text-sm">Free User</p>
                  <p className="text-xs opacity-70">
                    {userUploads}/{uploadLimit} uploads
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* VIEW TOGGLES */}
        <div className="flex gap-3">
          <button
            onClick={() => setView("market")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
              view === "market"
                ? "bg-indigo-600 text-white"
                : "bg-black/5 dark:bg-white/10"
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setView("my")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
              view === "my"
                ? "bg-indigo-600 text-white"
                : "bg-black/5 dark:bg-white/10"
            }`}
          >
            My Hostels
          </button>
        </div>

        {/* FILTERS */}
        {view === "market" && (
          <div className={`${card} p-4 rounded-2xl grid md:grid-cols-3 gap-3`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${inputBg}`}>
              <Search size={16} />
              <input
                placeholder="Search hostels..."
                className="bg-transparent outline-none w-full text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <input
              placeholder="Location"
              className={`px-3 py-2 rounded-xl ${inputBg} text-sm outline-none`}
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            />

            <input
              type="number"
              placeholder="Max price"
              className={`px-3 py-2 rounded-xl ${inputBg} text-sm outline-none`}
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
            />
          </div>
        )}

        {/* LISTINGS GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {(view === "market" ? filtered : hostels).map((h) => (
              <div key={h.id} className={`${card} rounded-2xl overflow-hidden`}>
                <div className="relative">
                  <ImageCarousel
                    images={h.images}
                    title={h.title}
                    dark={dark}
                    offsetTopRight={view === "my"}
                    verifiedBadge={
                      h.verified && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium shadow z-10">
                          <CheckCircle2 size={12} />
                          Verified
                        </div>
                      )
                    }
                    menuButton={
                      view === "my" && (
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => setActiveMenu(activeMenu === h.id ? null : h.id)}
                            className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenu === h.id && (
                            <div
                              className={`absolute right-0 mt-2 w-40 rounded-2xl overflow-hidden border shadow-2xl z-50 ${
                                dark
                                  ? "bg-[#111827] border-white/10 text-white"
                                  : "bg-white border-gray-200 text-gray-800"
                              }`}
                            >
                              <button
                                onClick={() => handleEdit(h)}
                                className="w-full px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 text-sm"
                              >
                                <Pencil size={15} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(h.id)}
                                className="w-full px-4 py-3 text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2 text-sm"
                              >
                                <Trash2 size={15} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    }
                  />
              </div>

                <div className="p-4 space-y-3">
                  <h2 className="font-semibold text-lg line-clamp-1">
                    {h.title}
                  </h2>
                  <p className="text-sm opacity-70 line-clamp-2">
                    {h.description}
                  </p>
                  <p className="flex items-center gap-1 text-sm opacity-70">
                    <MapPin size={14} />
                    {h.location}
                  </p>
                  <p className="text-indigo-500 font-bold flex items-center gap-1">
                    <DollarSign size={14} />
                    ₦{Number(h.price).toLocaleString()}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => shareHostel(h)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500/10 py-2.5 text-sm font-medium text-indigo-500 hover:bg-indigo-500/20 transition"
                    >
                      <Share2 size={14} />
                      Share
                    </button>

                    {view === "market" && (
                      <button
                        onClick={() => openWhatsApp(h.phone, h.title)}
                        className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition"
                      >
                        <Phone size={14} />
                        WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FLOATING ADD BUTTON */}
        <button
          onClick={() => {
            resetForm();
            setShowUpload(true);
          }}
          className="fixed bottom-28 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition z-40"
        >
          <PlusCircle size={24} />
        </button>

        {/* UPLOAD / EDIT MODAL */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className={`${card} w-full max-w-xl p-6 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2 text-lg">
                  <UploadCloud size={20} />
                  {editingHostel ? "Edit Hostel" : "Upload Hostel"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="Hostel Title"
                  className={`w-full p-3 rounded-xl ${inputBg} outline-none text-sm`}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                <input
                  placeholder="Location"
                  className={`w-full p-3 rounded-xl ${inputBg} outline-none text-sm`}
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />

                <input
                  type="number"
                  placeholder="Price"
                  className={`w-full p-3 rounded-xl ${inputBg} outline-none text-sm`}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />

                <input
                  placeholder="WhatsApp Number"
                  className={`w-full p-3 rounded-xl ${inputBg} outline-none text-sm`}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <textarea
                  placeholder="Short Description"
                  maxLength={120}
                  rows={3}
                  className={`w-full p-3 rounded-xl ${inputBg} resize-none outline-none text-sm`}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />

                {/* IMAGE UPLOADER */}
                <label className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                  <ImageIcon className="opacity-70 mb-2" size={28} />
                  <p className="text-sm font-medium">Upload Hostel Images</p>
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImages(e.target.files)}
                  />
                </label>

                {compressing && (
                  <p className="text-sm text-indigo-500 font-medium">
                    Compressing images...
                  </p>
                )}

                {savedSpace > 0 && (
                  <p className="text-sm text-emerald-500 font-medium">
                    Saved {savedSpace}% storage space!
                  </p>
                )}

                {/* PREVIEWS */}
                <div className="flex gap-3 overflow-x-auto py-1">
                  {previews.map((img, i) => (
                    <div key={i} className="relative min-w-[110px]">
                      <img
                        src={img}
                        className="h-24 w-28 object-cover rounded-xl border border-white/10"
                        alt="Preview"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* PROGRESS BAR */}
                {uploading && (
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs opacity-80">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  disabled={uploading || compressing}
                  onClick={handleUpload}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 mt-4"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : editingHostel ? (
                    "Save Changes"
                  ) : (
                    "Upload Hostel"
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