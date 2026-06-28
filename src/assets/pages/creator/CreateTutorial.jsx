import { useMemo, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";

import {
  Upload,
  Video,
  ImageIcon,
  FileText,
  DollarSign,
  Tag,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  ShieldCheck,
  CloudUpload,
} from "lucide-react";

import { db, auth } from "../../../firebase/config";
import { uploadVideo, uploadImage, uploadPDF } from "../../../services/cloudinary";
import { useNavigate } from "react-router-dom";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const ffmpeg = new FFmpeg();
let ffmpegLoaded = false;

/* =========================
   LOAD FFMPEG
========================= */
const loadFFmpeg = async () => {
  if (!ffmpegLoaded) {
    await ffmpeg.load();
    ffmpegLoaded = true;
  }
};

/* =========================
   COMPRESS VIDEO
========================= */
const compressVideo = async (file) => {
  try {
    await loadFFmpeg();

    const input = "input.mp4";
    const output = "output.mp4";

    await ffmpeg.writeFile(input, await fetchFile(file));

    await ffmpeg.exec([
      "-i",
      input,
      "-vcodec",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "fast",
      "-vf",
      "scale=iw*0.75:ih*0.75",
      output,
    ]);

    const data = await ffmpeg.readFile(output);

    const blob = new Blob([data], {
      type: "video/mp4",
    });

    return new File([blob], "compressed.mp4", {
      type: "video/mp4",
    });
  } catch (err) {
    console.error(err);
    throw new Error("Compression failed");
  }
};


/* =========================
   COMPONENT
========================= */
export default function CreateTutorial({ dark }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [progress, setProgress] = useState({
    video: 0,
    thumb: 0,
    pdf: 0,
  });

  const totalProgress = useMemo(() => {
    return Math.round(
      (progress.video + progress.thumb + progress.pdf) / 3
    );
  }, [progress]);

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!auth.currentUser) {
          toast.error("Login required");
          return;
        }

        if (!videoFile) {
          toast.error("Please upload a video file before publishing.");
          return;
        }
      setUploading(true);

      /* VIDEO */
      const compressedVideo = await compressVideo(videoFile);

      const videoResult = await uploadVideo(
        compressedVideo,
        (percent) =>
          setProgress((current) => ({
            ...current,
            video: Math.round(percent),
          }))
      );
      const videoUrl = videoResult.secure_url;

      /* THUMB */
      let thumbnailUrl = "";

      if (thumbnail) {
        const thumbnailResult = await uploadImage(
          thumbnail,
          (percent) =>
            setProgress((current) => ({
              ...current,
              thumb: Math.round(percent),
            }))
        );
        thumbnailUrl = thumbnailResult.secure_url;
      }

      /* PDF */
      let pdfUrl = "";

      if (pdfFile) {
        const pdfResult = await uploadPDF(
          pdfFile,
          (percent) =>
            setProgress((current) => ({
              ...current,
              pdf: Math.round(percent),
            }))
        );
        pdfUrl = pdfResult.secure_url;
      }

      /* SAVE */
      await addDoc(collection(db, "tutorials"), {
        title,
        description,
        category,
        price: Number(price),

        videoUrl,
        thumbnailUrl,
        pdfUrl,

        tutorId: auth.currentUser.uid,
        tutorName:
          auth.currentUser.displayName ||
          auth.currentUser.email,

        createdAt: serverTimestamp(),
      });

      toast.success("Tutorial uploaded successfully.");

      navigate("/tutorial-marketplace");
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress({
        video: 0,
        thumb: 0,
        pdf: 0,
      });
    }
  };

  /* =========================
     THEME
  ========================= */
  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-black";

  const card = dark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white border-gray-200";

  const input = `
    w-full rounded-2xl px-4 py-4 border outline-none transition-all duration-300
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${dark
      ? "bg-white/5 border-white/10 text-white placeholder:text-gray-400"
      : "bg-white border-gray-300 placeholder:text-gray-500"
    }
  `;

  return (
    <div
      className={`min-h-screen w-full md:pt-20 relative overflow-hidden ${bg}`}
    >
      {/* BACKGROUND */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 h-[22rem] w-[22rem] rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="absolute -bottom-24 -right-24 h-[22rem] w-[22rem] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* LEFT */}
          <div className="space-y-8 max-md:hidden">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-5">
                <Sparkles size={16} />
                Creator Studio
              </div>

              <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Publish Premium Tutorials Like a Pro.
              </h1>

              <p className="mt-5 text-lg text-gray-400 leading-relaxed">
                Upload courses with optimized video compression,
                Cloudinary-backed storage, premium UI,
                and scalable infrastructure built for modern
                creator platforms.
              </p>
            </div>

            {/* FEATURES */}
            <div className="grid sm:grid-cols-2 gap-5">
              <FeatureCard
                icon={<ShieldCheck size={20} />}
                title="Secure Uploads"
                text="Protected Firebase uploads with optimized delivery."
                dark={dark}
              />

              <FeatureCard
                icon={<CloudUpload size={20} />}
                title="Fast Processing"
                text="Automatic compression to reduce bandwidth costs."
                dark={dark}
              />

              <FeatureCard
                icon={<Sparkles size={20} />}
                title="Modern UX"
                text="Startup-level design inspired by premium SaaS."
                dark={dark}
              />

              <FeatureCard
                icon={<CheckCircle2 size={20} />}
                title="Scalable"
                text="Built for thousands of creators and students."
                dark={dark}
              />
            </div>

            {/* PREVIEW */}
            <div
              className={`rounded-3xl border p-6 ${card}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  <Video size={34} />
                </div>

                <div>
                  <h3 className="text-xl font-bold">
                    {title || "Your Tutorial Title"}
                  </h3>

                  <p className="text-sm text-gray-400 mt-1">
                    {category || "General"} • {price ? `₦${price}` : "Price not set"}
                  </p>
                </div>
              </div>

              <div className="mt-5 text-gray-400 text-sm leading-relaxed">
                {description ||
                  "A concise course summary will appear here after you type it above."}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div
              className={`rounded-4xl border p-6 shadow-2xl sm:p-7 md:p-8 ${card}`}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">
                  Create Tutorial
                </h2>

                <p className="text-gray-400 mt-2">
                  Upload your next premium course.
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg text-white">
                <Upload />
              </div>
            </div>

            {/* PROGRESS */}
            {uploading && (
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">
                    Upload Progress
                  </span>

                  <span className="font-bold">
                    {totalProgress}%
                  </span>
                </div>

                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalProgress}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <MiniProgress
                    label="Video"
                    value={progress.video}
                  />

                  <MiniProgress
                    label="Thumbnail"
                    value={progress.thumb}
                  />

                  <MiniProgress
                    label="PDF"
                    value={progress.pdf}
                  />
                </div>
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* TITLE */}
              <InputWrapper icon={<Sparkles size={18} />}>
                <input
                  className={input}
                  placeholder="Tutorial Title"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                />
              </InputWrapper>

              {/* DESCRIPTION */}
              <textarea
                className={`${input} min-h-[9.375rem] resize-none`}
                placeholder="Describe your tutorial in a professional and engaging way..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />

              <div className="grid md:grid-cols-2 gap-4">
                <InputWrapper icon={<Tag size={18} />}>
                  <input
                    className={input}
                    placeholder="Category"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value)
                    }
                  />
                </InputWrapper>

                <InputWrapper
                  icon={<DollarSign size={18} />}
                >
                  <input
                    type="number"
                    className={input}
                    placeholder="Price"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value)
                    }
                  />
                </InputWrapper>
              </div>

              {/* FILES */}
              <FileUpload
                title="Upload Video"
                subtitle="MP4, MOV, WEBM"
                icon={<Video size={22} />}
                file={videoFile}
                setFile={setVideoFile}
                accept="video/*"
                dark={dark}
              />

              <FileUpload
                title="Upload Thumbnail"
                subtitle="PNG, JPG"
                icon={<ImageIcon size={22} />}
                file={thumbnail}
                setFile={setThumbnail}
                accept="image/*"
                dark={dark}
              />

              <FileUpload
                title="Upload PDF Notes"
                subtitle="Study materials"
                icon={<FileText size={22} />}
                file={pdfFile}
                setFile={setPdfFile}
                accept=".pdf"
                dark={dark}
              />

              <button
                disabled={uploading}
                className="w-full h-16 rounded-2xl bg-linear-to-r from-blue-600 to-purple-600 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 font-bold text-lg shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Uploading Tutorial...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Publish Tutorial
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   FILE CARD
========================= */
function FileUpload({
  title,
  subtitle,
  icon,
  file,
  setFile,
  accept,
  dark,
}) {
  return (
    <label
      className={`
        flex items-center justify-between gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.01]
        ${
          dark
            ? "bg-white/5 border-white/10 hover:bg-white/10"
            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
          {icon}
        </div>

        <div>
          <h4 className="font-bold">{title}</h4>
          <p className="text-sm text-gray-400">
            {file ? file.name : subtitle}
          </p>
        </div>
      </div>

      <div>
        {file ? (
          <CheckCircle2 className="text-green-500" />
        ) : (
          <Upload />
        )}
      </div>

      <input
        hidden
        type="file"
        accept={accept}
        onChange={(e) => setFile(e.target.files[0])}
      />
    </label>
  );
}

/* =========================
   FEATURE CARD
========================= */
function FeatureCard({
  icon,
  title,
  text,
  dark,
}) {
  return (
    <div
      className={`rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1
      ${
        dark
          ? "bg-white/5 border-white/10"
          : "bg-white border-gray-200"
      }
    `}
    >
      <div className="w-12 h-12 text-white rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
        {icon}
      </div>

      <h3 className="font-bold text-lg">{title}</h3>

      <p className="text-gray-400 text-sm mt-2 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

/* =========================
   INPUT WRAPPER
========================= */
function InputWrapper({ icon, children }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>

      <div className="[&>input]:pl-12">
        {children}
      </div>
    </div>
  );
}

/* =========================
   MINI PROGRESS
========================= */
function MiniProgress({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-linear-to-r from-blue-500 to-purple-600"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
