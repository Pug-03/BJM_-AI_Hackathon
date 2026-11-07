import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-4"
    >
      <p className="text-small text-graphite">404</p>
      <h1 className="text-h1 tracking-display">{t("notFoundTitle")}</h1>
      <p className="text-graphite">{t("notFoundBody")}</p>
      <Button asChild>
        <Link href="/">{t("home")}</Link>
      </Button>
    </main>
  );
}
