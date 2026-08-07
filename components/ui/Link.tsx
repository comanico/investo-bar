import AnchorLink from "react-anchor-link-smooth-scroll";
import { SelectedPage } from "../../lib/types";
import { useTranslation } from "react-i18next";

type Props = {
  page: string;
  selectedPage?: SelectedPage;
  setSelectedPage: (value: SelectedPage) => void;
  className?: string;
};

function Link({ page, selectedPage, setSelectedPage, className }: Props) {
  const { t } = useTranslation();
  const pageToEnum: {
    [key: string]: { enumValue: SelectedPage; href: string };
  } = {
    [t("menu.home")]: { enumValue: SelectedPage.Home, href: "home" },
    [t("menu.feature")]: { enumValue: SelectedPage.Feature, href: "feature" },
    [t("menu.solution")]: {
      enumValue: SelectedPage.Solution,
      href: "solution",
    },
    [t("menu.reviews")]: { enumValue: SelectedPage.Reviews, href: "reviews" },
    [t("menu.about")]: { enumValue: SelectedPage.About, href: "about" },
  };

  const handleClick = () => {
    const { enumValue } = pageToEnum[page] || {};
    if (enumValue) {
      setSelectedPage(enumValue);
    }
  };

  const href = pageToEnum[page]?.href || "home";

  return (
    <AnchorLink
      className={`${className} ${
        selectedPage === pageToEnum[page]?.enumValue
          ? "text-accent-foreground"
          : ""
      }`}
      href={`#${href}`}
      onClick={handleClick}
    >
      {page}
    </AnchorLink>
  );
}

export default Link;
