import { SchoolPanel } from "@/components/schools/school-panel";
import { schoolGuidedIterationsData } from "@/lib/schools/demo";

export default function SchoolDemoPage() {
  return <SchoolPanel initialData={schoolGuidedIterationsData()} demo/>;
}
