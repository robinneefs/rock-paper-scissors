/** A menu is data: a list of these, drawn by MenuView. */
export interface MenuItem {
  id: string;
  label: string;
  /** Small text on the right (e.g. "VS RIVAL", "SOON"). */
  tag?: string;
  enabled: boolean;
  onSelect?: () => void;
}
