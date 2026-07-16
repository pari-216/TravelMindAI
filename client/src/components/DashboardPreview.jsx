import { motion } from "framer-motion";

export default function DashboardPreview() {
  return (
    // Skip this section in Lovable UI clone since they merged dashboard preview 
    // into the features / AI Assistant sections. The reference site does NOT have a separate Dashboard mockup section.
    // However, since it is imported in Home.jsx, we will just return null to hide it without breaking imports.
    null
  );
}
