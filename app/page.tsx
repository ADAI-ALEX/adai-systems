import { redirect } from "next/navigation";

/** While the three directions are under review, the home page is the comparison. */
export default function Home() {
  redirect("/directions");
}
