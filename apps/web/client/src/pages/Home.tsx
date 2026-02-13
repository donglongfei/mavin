/**
 * Cyberpunk Lab - Home Page
 * 
 * Main application view with three-pane cockpit layout
 */

import Layout from "@/components/Layout";
import LeftPane from "@/components/LeftPane";
import MiddlePane from "@/components/MiddlePane";
import RightPane from "@/components/RightPane";

export default function Home() {
  return (
    <Layout
      leftPane={<LeftPane />}
      middlePane={<MiddlePane />}
      rightPane={<RightPane />}
    />
  );
}
