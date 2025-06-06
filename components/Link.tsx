import AnchorLink from "react-anchor-link-smooth-scroll";
import { SelectedPage } from "../lib/types";

type Props = {
  page: string;
  selectedPage?: SelectedPage;
  setSelectedPage: (value: SelectedPage) => void;
  className?: string;
};

function Link({ page, setSelectedPage, className }: Props) {
  const lowerCasePage = page
    .toLocaleLowerCase()
    .replace(/ /g, "") as SelectedPage;
  return (
    <AnchorLink
      className={`${className}`}
      href={`#${lowerCasePage}`}
      onClick={() => setSelectedPage(lowerCasePage)}
    >
      {page}
    </AnchorLink>
  );
}

export default Link;
