import UploadNovel from "@/components/UploadNovel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload truyện - StoryTrans",
  description: "Tải lên file truyện tiếng Trung để dịch sang tiếng Việt bằng AI",
};

export default function UploadPage() {
  return <UploadNovel />;
}

