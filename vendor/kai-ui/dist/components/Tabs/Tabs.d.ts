import "./tabs.css";
export interface TabItem {
    url: string;
    label: string;
}
export interface TabsProps {
    items: TabItem[];
    activeTab?: string;
}
declare const Tabs: React.FC<TabsProps>;
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map