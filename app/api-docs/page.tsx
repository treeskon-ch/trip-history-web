import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MainLayout from "../../components/layout/MainLayout";

export default function ApiDocsPage() {
  // Read the markdown file from the project root
  const filePath = path.join(process.cwd(), "API_DOCS.md");
  let markdownContent = "API Documentation not found.";
  
  try {
    markdownContent = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading API_DOCS.md:", error);
  }

  return (
    <MainLayout>
      <div className="flex-1 w-full p-8 max-w-5xl mx-auto overflow-y-auto h-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">คู่มือ API (API Documentation)</h1>
          <p className="text-gray-500 mt-2">เอกสารคู่มือการใช้งาน API ล่าสุดของระบบ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 prose prose-brand max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
    </MainLayout>
  );
}
