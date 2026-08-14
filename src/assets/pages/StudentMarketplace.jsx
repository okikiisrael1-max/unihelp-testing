import { useEffect, useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  DollarSign,
  Phone,
  Loader2,
  PlusCircle,
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
import ImageCarousel from "./../components/ImageCarousel";
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
import { deleteCloudinaryAssets, deleteMediaDocument } from "../../services/mediaCleanup";
import { buildShareUrl, shareContent } from "../utils/share";

export default function StudentMarketplace({ dark }) {
  /* =====================================================
     STATES
  ===================================================== */
  const [view, setView] = useState("market");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  // Modal & Upload
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [, setCompressing] = useState(false);
  const [, setProgress] = useState(0);
  const [, setSavedSpace] = useState(0);

  // Files & Previews
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const previewUrlsRef = useRef([]); // Track ObjectURLs for memory cleanup

  // Plan & User Limits
  const [isPremium, setIsPremium] = useState(false);
  const [uploadLimit, setUploadLimit] = useState(3);
  const [userUploads, setUserUploads] = useState(0);

  // Editing & UI Controls
  const [editingItem, setEditingItem] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    category: "",
    price: "",
    phone: "",
    description: "",
  });

  /* =====================================================
     CLEANUP OBJECT URLS (MEMORY LEAK FIX)
  ===================================================== */
  const clearObjectUrls = () => {
    previewUrlsRef.current.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    previewUrlsRef.current = [];
  };

  /* =====================================================
     FETCH USER PLAN
  ===================================================== */
  const fetchUserPlan = async () => {
    try {
      if (!auth.currentUser) return;

      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const premium = data.premium === true;
        setIsPremium(premium);
        setUploadLimit(premium ? 10 : 3);
      }

      const q = query(
        collection(db, "studentMarketplace"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snap = await getDocs(q);
      setUserUploads(snap.size);
    } catch (err) {
      console.error("Error fetching user plan:", err);
    }
  };

  /* =====================================================
     FETCH ITEMS
  ===================================================== */
  const fetchItems = async () => {
    setLoading(true);
    try {
      const q =
        view === "market"
          ? query(collection(db, "studentMarketplace"))
          : query(
              collection(db, "studentMarketplace"),
              where("userId", "==", auth.currentUser?.uid || "")
            );

      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching marketplace items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchUserPlan();
  }, [view]);

  /* =====================================================
     OUTSIDE CLICK LISTENER FOR MENU
  ===================================================== */
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".menu-container")) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  /* =====================================================
     FILTER LOGIC
  ===================================================== */
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase());

    const matchCategory = filterCategory
      ? item.category?.toLowerCase().includes(filterCategory.toLowerCase())
      : true;

    const matchPrice = filterPrice
      ? Number(item.price) <= Number(filterPrice)
      : true;

    return matchSearch && matchCategory && matchPrice;
  });

  /* =====================================================
     IMAGE COMPRESSION & SELECTION
  ===================================================== */
  const compressImage = async (file) => {
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        fileType: "image/webp",
      };
      return await imageCompression(file, options);
    } catch (err) {
      console.warn("Compression failed, using original file:", err);
      return file;
    }
  };

  const handleImages = async (files) => {
    if (!files || !files.length) return;

    setCompressing(true);
    clearObjectUrls();

    try {
      const selected = Array.from(files);
      const compressedFiles = [];
      const previewUrls = [];

      let original = 0;
      let compressed = 0;

      for (let file of selected) {
        original += file.size;
        const optimized = await compressImage(file);
        compressed += optimized.size;

        compressedFiles.push(optimized);
        const objectUrl = URL.createObjectURL(optimized);
        previewUrls.push(objectUrl);
        previewUrlsRef.current.push(objectUrl);
      }

      setSavedSpace(
        Math.round(((original - compressed) / (original || 1)) * 100)
      );
      setImages(compressedFiles);
      setPreviews(previewUrls);
    } catch (err) {
      console.error("Error processing images:", err);
      toast.error("Failed to process images.");
    } finally {
      setCompressing(false);
    }
  };

  /* =====================================================
     HANDLE UPLOAD / UPDATE
  ===================================================== */
  const handleUpload = async () => {
    if (!auth.currentUser) {
      toast.error("Please login first.");
      return;
    }

    if (!editingItem && userUploads >= uploadLimit) {
      toast.error(
        isPremium
          ? "Premium upload limit reached (10/10)."
          : "Free tier limit reached (3/3). Upgrade to upload more."
      );
      return;
    }

    if (!form.title || !form.category || !form.price || !form.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setUploading(true);
    const newlyUploadedAssets = [];
    const replacedAssets = images.length > 0 ? editingItem?.imageAssets || [] : [];

    try {
      let imageUrls = editingItem?.images || [];
      let imageAssets = editingItem?.imageAssets || [];

      // If new images were selected, upload them
      if (images.length > 0) {
        imageUrls = [];
        imageAssets = [];

        for (let img of images) {
          const result = await uploadImage(img, (percent) => {
            setProgress(Math.round(percent));
          });
          imageUrls.push(result.secure_url);
          const asset = toCloudinaryAsset(result);
          imageAssets.push(asset);
          newlyUploadedAssets.push(asset);
        }
      }

      const payload = {
        title: form.title.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        phone: form.phone.trim(),
        description: form.description.trim(),
        images: imageUrls,
        imageAssets,
        updatedAt: new Date(),
      };

      if (editingItem) {
        await updateDoc(doc(db, "studentMarketplace", editingItem.id), payload);
        toast.success("Listing updated successfully 🚀");
      } else {
        await addDoc(collection(db, "studentMarketplace"), {
          ...payload,
          userId: auth.currentUser.uid,
          createdAt: new Date(),
          status: "pending",
          verified: isPremium,
          premiumUser: isPremium,
        });
        toast.success("Listing published successfully 🚀");
      }

      resetForm();
      fetchItems();
      fetchUserPlan();
      if (replacedAssets.length > 0) {
        await deleteCloudinaryAssets({ assets: replacedAssets }).catch((cleanupError) => {
          console.warn("Unable to clean up replaced listing images", cleanupError);
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (newlyUploadedAssets.length > 0) {
        await deleteCloudinaryAssets({ assets: newlyUploadedAssets }).catch((cleanupError) => {
          console.warn("Unable to clean up failed listing upload", cleanupError);
        });
      }
      toast.error("Operation failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /* =====================================================
     RESET FORM
  ===================================================== */
  const resetForm = () => {
    clearObjectUrls();
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
    setEditingItem(null);
    setShowUpload(false);
  };

  /* =====================================================
     EDIT & DELETE
  ===================================================== */
  const handleEdit = (item) => {
    clearObjectUrls();
    setEditingItem(item);
    setForm({
      title: item.title || "",
      category: item.category || "",
      price: item.price || "",
      phone: item.phone || "",
      description: item.description || "",
    });
    setPreviews(item.images || []);
    setShowUpload(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      await deleteMediaDocument("studentMarketplace", id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      fetchUserPlan();
      toast.success("Listing deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete product.");
    }
  };

  /* =====================================================
     SHARE & WHATSAPP
  ===================================================== */
  const openWhatsApp = (phone, title) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = `Hi, I'm interested in "${title}" on UniHelp Marketplace.`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const shareProduct = async (item) => {
    const shareUrl = buildShareUrl("/studentmarketplace", { product: item.id });
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
      console.error("Share error:", error);
      toast.error("Unable to share this product right now.");
    }
  };

  /* =====================================================
     THEME STYLES
  ===================================================== */
  const bg = dark ? "bg-[#0b0f1a] text-white" : "bg-[#f6f8fc] text-gray-900";
  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-gray-200 shadow-sm";

  return (
    <div className={`min-h-screen w-full md:pt-20 px-4 py-6 ${bg}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex gap-2.5 max-md:flex-col-reverse md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 shrink-0 rounded-2xl bg-indigo-600 text-white">
              <ShoppingBag />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Marketplace</h1>
              <p className="text-sm opacity-70">Buy & Sell Easily</p>
            </div>
          </div>

          {/* PLAN */}
          <div
            className={`${card} px-4 py-3 shrink-0 rounded-2xl flex max-w-xs items-center gap-3`}
          >
            {isPremium ? (
              <>
                <Crown className="text-yellow-500" />
                <div>
                  <p className="font-semibold">Premium User</p>
                  <p className="text-xs opacity-70">
                    {userUploads}/10 uploads
                  </p>
                </div>
              </>
            ) : (
              <div
                onClick={() => navigate("/premium")}
                className="cursor-pointer flex justify-between items-center gap-3"
              >
                <Lock className="text-red-500" />
                <div>
                  <p className="font-semibold">Free User</p>
                  <p className="text-xs opacity-70">{userUploads}/3 uploads</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TOGGLE */}
        <div className="flex gap-3">
          <button
            onClick={() => setView("market")}
            className={`px-5 py-2 rounded-xl transition ${
              view === "market" ? "bg-indigo-600 text-white" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setView("my")}
            className={`px-5 py-2 rounded-xl transition ${
              view === "my" ? "bg-indigo-600 text-white" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            My Products
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        {view === "market" && (
          <div className={`${card} p-4 rounded-2xl grid md:grid-cols-3 gap-3`}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5">
              <Search size={16} />
              <input
                placeholder="Search products..."
                className="bg-transparent outline-none w-full text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <input
              placeholder="Category"
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            />

            <input
              type="number"
              placeholder="Max price"
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
            />
          </div>
        )}

        {/* GRID PRODUCT LIST */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {(view === "market" ? filteredItems : items).map((item) => (
              <div key={item.id} className={`${card} rounded-2xl overflow-hidden flex flex-col justify-between`}>
                <div>
                  {/* IMAGE */}
                  <div className="relative menu-container">
                    <ImageCarousel
                      images={item.images}
                      title={item.title}
                      dark={dark}
                      offsetTopRight={view === "my"}
                      verifiedBadge={
                        item.verified && (
                          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow z-10">
                            <CheckCircle2 size={12} />
                            Verified
                          </div>
                        )
                      }
                      menuButton={
                        view === "my" && (
                          <div className="absolute top-3 right-3 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === item.id ? null : item.id);
                              }}
                              className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenu === item.id && (
                              <div className="absolute right-0 mt-2 w-40 rounded-2xl overflow-hidden bg-[#111827] border border-white/10 shadow-2xl z-50">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-2 text-sm text-white"
                                >
                                  <Pencil size={15} />
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="w-full px-4 py-3 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-sm"
                                >
                                  <Trash2 size={15} />
                                  Delete Product
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      }
                    />
                  </div>

                  {/* DETAILS */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <h2 className="font-semibold text-lg line-clamp-1">{item.title}</h2>
                      <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        <Tag size={11} />
                        {item.category}
                      </span>
                    </div>

                    <p className="text-sm opacity-70 line-clamp-2">{item.description}</p>

                    <p className="text-indigo-500 font-bold flex items-center gap-1 text-lg">
                      <DollarSign size={16} />
                      ₦{Number(item.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* CARD ACTIONS */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => shareProduct(item)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 py-3 text-sm font-medium text-indigo-500 transition"
                  >
                    <Share2 size={15} />
                    Share
                  </button>

                  {view === "market" && item.phone && (
                    <button
                      onClick={() => openWhatsApp(item.phone, item.title)}
                      className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-medium text-white transition"
                    >
                      <Phone size={15} />
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FLOATING ACTION BUTTON */}
        <button
          onClick={() => {
            resetForm();
            setShowUpload(true);
          }}
          className="fixed bottom-10 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition z-40"
          aria-label="Upload item"
        >
          <PlusCircle size={24} />
        </button>

        {/* UPLOAD / EDIT MODAL */}
        {showUpload && (
          <div className="fixed inset-0 z-[501] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className={`${card} w-full max-w-2xl rounded-3xl p-5 max-h-[90vh] overflow-y-auto sm:p-6`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">
                  {editingItem ? "Edit Product" : "Upload Product"}
                </h2>
                <button onClick={resetForm} className="p-1 hover:opacity-70">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  placeholder="Product Title"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                <input
                  placeholder="Category (e.g. Textbooks, Electronics)"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />

                <input
                  type="number"
                  placeholder="Price (NGN)"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none text-sm"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />

                <input
                  placeholder="WhatsApp Phone Number"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <textarea
                  rows={4}
                  placeholder="Product Description"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none text-sm resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                {/* FILE INPUT */}
                <label className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                  <ImageIcon className="opacity-70 mb-2" size={28} />
                  <p className="font-medium text-sm">Upload Images</p>
                  <span className="text-xs opacity-60 mt-1">Supports JPG, PNG, WEBP</span>
                  <input
                    hidden
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImages(e.target.files)}
                  />
                </label>

                {/* PREVIEWS */}
                {previews.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto py-2">
                    {previews.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Preview"
                        className="h-24 w-24 rounded-xl object-cover border border-white/10"
                      />
                    ))}
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
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
