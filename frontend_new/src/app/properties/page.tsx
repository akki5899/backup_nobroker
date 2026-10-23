import PropertyListingPage from "@/components/PropertyListingPage";

export default function PropertiesPage() {
    // Using "Buy" as default type for general properties page, or could be modified to show all
    return <PropertyListingPage type="Buy" title="All Properties" />;
}
