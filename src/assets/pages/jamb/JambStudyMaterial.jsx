import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Crown,
  Download,
  FileText,
  Filter,
  Lock,
  Search,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  Video,
  BookOpen,
  BrainCircuit,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FolderOpen,
  CalendarDays,
  CloudUpload,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import {
  db,
} from "../../../firebase/config";

import {
  getCloudinaryAttachmentUrl,
  getCloudinaryPreviewUrl,
  uploadFile,
} from "../../../services/cloudinary";

import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

const JambStudyMaterials = ({
  dark = true,
}) => {
  const navigate = useNavigate();

  const { user } =
    useContext(AuthContext);

  /**
   * =========================================================
   * STATES
   * =========================================================
   */

  const [search, setSearch] =
    useState("");

  const [
    activeCategory,
    setActiveCategory,
  ] = useState("All");

  const [materials, setMaterials] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState("");

  const [premiumLoading, setPremiumLoading] =
    useState(true);

  const [isPremium, setIsPremium] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /**
   * =========================================================
   * ADMIN CHECK
   * =========================================================
   */

  const isAdmin =
    user?.email ===
    "onakomayaokiki@gmail.com";

  /**
   * =========================================================
   * FORM
   * =========================================================
   */

  const [form, setForm] =
    useState({
      title: "",
      type: "PDF",
      subject: "",
      description: "",
      file: null,
    });

  /**
   * =========================================================
   * CATEGORIES
   * =========================================================
   */

  const categories = [
    "All",
    "PDF",
    "Video",
    "Notes",
    "CBT Guide",
  ];

  /**
/**
 * =========================================================
 * CHECK PREMIUM
 * =========================================================
 */

  const checkPremium = async () => {
    try {

      if (!user?.uid) {
        setPremiumLoading(false);
      return;
    }

    const subRef = doc(
      db,
      "subscriptions",
      user.uid,
    );

      const subSnap =
        await getDoc(subRef);

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnap =
        await getDoc(userRef);

      const subData =
        subSnap.exists()
          ? subSnap.data()
          : {};

      const userData =
        userSnap.exists()
          ? userSnap.data()
          : {};

      setIsPremium(
        subData?.subscription
          ?.active === true ||
          userData?.premium === true ||
          userData?.verified === true ||
          userData?.subscriptionStatus ===
            "active"
      );

  } catch (error) {

    console.log(error);

    setIsPremium(false);

  } finally {

    setPremiumLoading(false);

  }
};
  /**
   * =========================================================
   * FETCH MATERIALS
   * =========================================================
   */

  const fetchMaterials =
    async () => {
      try {
        setLoading(true);

        const q = query(
          collection(
            db,
            "study_materials",
          ),
          orderBy(
            "createdAt",
            "desc",
          ),
        );

        const snap =
          await getDocs(q);

        const arr = [];

        snap.forEach((doc) => {
          arr.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setMaterials(arr);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchMaterials();
    checkPremium();
  }, [user]);

  /**
   * =========================================================
   * UPLOAD MATERIAL
   * =========================================================
   */

  const handleUpload =
    async () => {
      try {
        if (
          !form.title ||
          !form.subject ||
          !form.description ||
          !form.file
        ) {
          setMessage(
            "Please fill all fields",
          );

          return;
        }

        setUploading(true);

        const result =
          await uploadFile(
            form.file,
          );

        const fileUrl =
          result.secure_url;

        /**
         * FIRESTORE
         */

        await addDoc(
          collection(
            db,
            "study_materials",
          ),
          {
            title: form.title,
            type: form.type,
            subject:
              form.subject,
            description:
              form.description,
            fileUrl,
            downloadUrl:
              getCloudinaryAttachmentUrl(
                fileUrl,
                form.file.name,
              ),
            previewUrl:
              form.file.type ===
                "application/pdf" ||
              form.file.name
                .toLowerCase()
                .endsWith(".pdf")
                ? getCloudinaryPreviewUrl(
                    fileUrl,
                  )
                : fileUrl,
            fileName:
              form.file.name,
            fileSize:
              form.file.size,
            createdAt:
              serverTimestamp(),
            uploadedBy:
              user?.email || "",
          },
        );

        setMessage(
          "Material uploaded successfully 🚀",
        );

        setForm({
          title: "",
          type: "PDF",
          subject: "",
          description: "",
          file: null,
        });

        fetchMaterials();
      } catch (error) {
        console.log(error);

        setMessage(
          "Upload failed",
        );
      } finally {
        setUploading(false);

        setTimeout(() => {
          setMessage("");
        }, 4000);
      }
    };

  /**
   * =========================================================
   * DELETE
   * =========================================================
   */

  const handleDelete =
    async (id) => {
      try {
        setDeletingId(id);

        await deleteDoc(
          doc(
            db,
            "study_materials",
            id,
          ),
        );

        setMaterials((prev) =>
          prev.filter(
            (item) =>
              item.id !== id,
          ),
        );
      } catch (error) {
        console.log(error);
      } finally {
        setDeletingId("");
      }
    };

  /**
   * =========================================================
   * DOWNLOAD
   * =========================================================
   */

  const handleDownload =
    (material) => {
      if (!user) {
        setMessage(
          "Please login first",
        );

        return;
      }

      /**
       * PREMIUM CHECK
       */

      if (!isPremium) {
        setMessage(
          "Only premium users can download materials 🚀",
        );

        return;
      }

    const downloadUrl =
        material.downloadUrl ||
        getCloudinaryAttachmentUrl(
          material.fileUrl,
          material.fileName,
        ) ||
        material.fileUrl;

      window.open(
        downloadUrl,
        "_blank",
      );
    };

  /**
   * =========================================================
   * FILTER MATERIALS
   * =========================================================
   */

  const filteredMaterials =
    useMemo(() => {
      return materials.filter(
        (item) => {
          const matchesSearch =
            item.title
              ?.toLowerCase()
              .includes(
                search.toLowerCase(),
              ) ||
            item.subject
              ?.toLowerCase()
              .includes(
                search.toLowerCase(),
              );

          const matchesCategory =
            activeCategory ===
              "All" ||
            item.type ===
              activeCategory;

          return (
            matchesSearch &&
            matchesCategory
          );
        },
      );
    }, [
      materials,
      search,
      activeCategory,
    ]);

  /**
   * =========================================================
   * THEME
   * =========================================================
   */

  const bg = dark
    ? "bg-[#020817] text-white"
    : "bg-slate-100 text-slate-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-slate-200";

  const fade = dark
    ? "text-slate-400"
    : "text-slate-500";

  const input = dark
    ? "bg-white/5 border border-white/10 text-white placeholder:text-slate-500"
    : "bg-white border border-slate-200 text-slate-900";

  return (
    <div
      className={`min-h-screen overflow-hidden relative ${bg}`}
    >
      {/* ========================================================= */}
      {/* BACKGROUND */}
      {/* ========================================================= */}

      <div className="fixed top-0 left-0 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />

      <div className="fixed bottom-0 right-0 w-72 h-72 bg-purple-500/20 blur-3xl rounded-full" />

      {/* ========================================================= */}
      {/* MAIN */}
      {/* ========================================================= */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* ========================================================= */}
        {/* HEADER */}
        {/* ========================================================= */}

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
          {/* LEFT */}

          <div className="flex items-start gap-4">
            <button
              onClick={() =>
                navigate(-1)
              }
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${card}`}
            >
              <ArrowLeft />
            </button>

            <div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                Study Materials
              </h1>

              <p
                className={`mt-2 text-sm md:text-base ${fade}`}
              >
                Premium learning
                resources for
                students
              </p>
            </div>
          </div>

          {/* STATUS */}

          <div
            className={`rounded-[28px] p-5 flex items-center gap-4 ${card}`}
          >
            {premiumLoading ? (
              <Loader2 className="animate-spin" />
            ) : isPremium ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="text-green-500" />
                </div>

                <div>
                  <h3 className="font-black text-lg">
                    Premium Active
                  </h3>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Unlimited
                    downloads
                    unlocked
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                  <Lock className="text-yellow-500" />
                </div>

                <div>
                  <h3 className="font-black text-lg">
                    Premium Locked
                  </h3>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Upgrade to
                    download
                    materials
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MESSAGE */}
        {/* ========================================================= */}

        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 flex items-center gap-3 ${
              message.includes(
                "success",
              )
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {message.includes(
              "success",
            ) ? (
              <CheckCircle2 />
            ) : (
              <XCircle />
            )}

            <span className="font-medium">
              {message}
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* ADMIN PANEL */}
        {/* ========================================================= */}

        {isAdmin && (
          <div
            className={`rounded-[36px] p-6 md:p-8 mb-8 ${card}`}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center">
                <CloudUpload className="text-indigo-500" />
              </div>

              <div>
                <h2 className="text-3xl font-black">
                  Admin Upload
                  Panel
                </h2>

                <p
                  className={`${fade} mt-1`}
                >
                  Upload premium
                  study materials
                </p>
              </div>
            </div>

            {/* FORM */}

            <div className="grid md:grid-cols-2 gap-5">
              {/* TITLE */}

              <input
                type="text"
                placeholder="Material title"
                value={
                  form.title
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target
                        .value,
                  })
                }
                className={`h-14 px-5 rounded-2xl outline-none ${input}`}
              />

              {/* SUBJECT */}

              <input
                type="text"
                placeholder="Subject"
                value={
                  form.subject
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    subject:
                      e.target
                        .value,
                  })
                }
                className={`h-14 px-5 rounded-2xl outline-none ${input}`}
              />

              {/* TYPE */}

              <select
                value={
                  form.type
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target
                      .value,
                  })
                }
                className={`h-14 px-5 rounded-2xl outline-none ${input}`}
              >
                <option value="PDF">
                  PDF
                </option>

                <option value="Video">
                  Video
                </option>

                <option value="Notes">
                  Notes
                </option>

                <option value="CBT Guide">
                  CBT Guide
                </option>
              </select>

              {/* FILE */}

              <label
                className={`h-14 px-5 rounded-2xl flex items-center gap-3 cursor-pointer ${input}`}
              >
                <UploadCloud
                  size={18}
                />

                <span className="truncate">
                  {form.file
                    ? form.file
                        .name
                    : "Choose File"}
                </span>

                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    setForm({
                      ...form,
                      file:
                        e.target
                          .files[0],
                    })
                  }
                />
              </label>

              {/* DESCRIPTION */}

              <textarea
                rows="5"
                placeholder="Description..."
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
                className={`md:col-span-2 p-5 rounded-2xl outline-none resize-none ${input}`}
              />
            </div>

            {/* BUTTON */}

            <button
              onClick={
                handleUpload
              }
              disabled={
                uploading
              }
              className="mt-6 h-14 px-8 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition-all text-white font-bold flex items-center justify-center gap-3"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" />

                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud />

                  Upload Material
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SEARCH */}
        {/* ========================================================= */}

        <div className="relative mb-6">
          <Search
            size={18}
            className={`absolute left-5 top-1/2 -translate-y-1/2 ${fade}`}
          />

          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            className={`w-full h-14 rounded-2xl pl-14 pr-5 outline-none ${input}`}
          />
        </div>

        {/* ========================================================= */}
        {/* FILTERS */}
        {/* ========================================================= */}

        <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <div
            className={`h-12 px-5 rounded-2xl flex items-center gap-2 shrink-0 ${card}`}
          >
            <Filter
              size={16}
              className="text-indigo-500"
            />

            <span className="font-semibold">
              Filter
            </span>
          </div>

          {categories.map(
            (
              category,
              index,
            ) => (
              <button
                key={index}
                onClick={() =>
                  setActiveCategory(
                    category,
                  )
                }
                className={`h-12 px-5 rounded-2xl text-sm font-semibold shrink-0 transition-all ${
                  activeCategory ===
                  category
                    ? "bg-indigo-500 text-white"
                    : card
                }`}
              >
                {category}
              </button>
            ),
          )}
        </div>

        {/* ========================================================= */}
        {/* LOADING */}
        {/* ========================================================= */}

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* MATERIALS */}
            {/* ========================================================= */}

            <div className="grid xl:grid-cols-2 gap-6">
              {filteredMaterials.map(
                (
                  material,
                  index,
                ) => (
                  <div
                    key={index}
                    className={`rounded-[36px] p-6 transition-all hover:scale-[1.01] ${card}`}
                  >
                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">
                      {/* LEFT */}

                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                          {material.type ===
                          "PDF" ? (
                            <FileText />
                          ) : material.type ===
                            "Video" ? (
                            <Video />
                          ) : material.type ===
                            "Notes" ? (
                            <BookOpen />
                          ) : (
                            <BrainCircuit />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-2xl font-black break-words leading-tight">
                            {
                              material.title
                            }
                          </h2>

                          <div
                            className={`flex flex-wrap items-center gap-2 mt-3 text-sm ${fade}`}
                          >
                            <span>
                              {
                                material.subject
                              }
                            </span>

                            <span>
                              •
                            </span>

                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star
                                size={
                                  14
                                }
                                fill="currentColor"
                              />

                              5.0
                            </div>

                            <span>
                              •
                            </span>

                            <div className="flex items-center gap-1">
                              <FolderOpen size={14} />

                              {
                                material.type
                              }
                            </div>
                          </div>

                          <p
                            className={`mt-4 text-sm leading-relaxed ${fade}`}
                          >
                            {
                              material.description
                            }
                          </p>
                        </div>
                      </div>

                      {/* TYPE */}

                      <div className="px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-xs font-black shrink-0">
                        {
                          material.type
                        }
                      </div>
                    </div>

                    {/* FOOTER */}

                    <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      {/* LEFT */}

                      <div
                        className={`flex flex-wrap items-center gap-4 text-sm ${fade}`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={15} />

                          Premium
                          Protected
                        </div>

                        <div className="flex items-center gap-2">
                          <CalendarDays size={15} />

                          Recently
                          Updated
                        </div>
                      </div>

                      {/* BUTTONS */}

                      <div className="flex flex-wrap gap-3">
                        {/* PREVIEW */}

                      <button
                          onClick={() =>
                            window.open(
                              getCloudinaryPreviewUrl(
                                material.fileUrl ||
                                  material.previewUrl
                              ),
                              "_blank",
                            )
                          }
                          className={`h-12 px-5 rounded-2xl flex items-center gap-2 font-semibold transition-all ${card}`}
                        >
                          <Eye size={17} />

                          Preview
                        </button>

                        {/* DOWNLOAD */}

                        <button
                          onClick={() =>
                            handleDownload(
                              material,
                            )
                          }
                          className={`h-12 px-5 rounded-2xl text-white font-bold flex items-center gap-2 transition-all ${
                            isPremium
                              ? "bg-indigo-500 hover:bg-indigo-600"
                              : "bg-yellow-500 hover:bg-yellow-600"
                          }`}
                        >
                          {isPremium ? (
                            <>
                              <Download size={17} />

                              Download
                            </>
                          ) : (
                            <>
                              <Crown size={17} />

                              Premium
                            </>
                          )}
                        </button>

                        {/* DELETE */}

                        {isAdmin && (
                          <button
                            onClick={() =>
                              handleDelete(
                                material.id,
                              )
                            }
                            className="h-12 px-4 rounded-2xl bg-red-500 hover:bg-red-600 transition-all text-white"
                          >
                            {deletingId ===
                            material.id ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Trash2 />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* ========================================================= */}
            {/* EMPTY */}
            {/* ========================================================= */}

            {filteredMaterials.length ===
              0 && (
              <div
                className={`rounded-[36px] p-14 text-center mt-10 ${card}`}
              >
                <XCircle
                  size={60}
                  className="mx-auto text-indigo-500 mb-5"
                />

                <h2 className="text-3xl font-black">
                  No Materials
                  Found
                </h2>

                <p
                  className={`mt-3 ${fade}`}
                >
                  No study
                  material
                  available yet
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JambStudyMaterials;
