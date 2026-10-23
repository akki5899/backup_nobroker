import { FilterBadge } from "@/components/ui/filter-badge"

export function FilterBadgePill() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <FilterBadge
        variant="pill"
        label="Department"
        value="Sales"
        onRemove={() => {}}
      />
      <FilterBadge
        variant="pill"
        label="Location"
        value="Zurich"
        onRemove={() => {}}
      />
      <FilterBadge
        variant="pill"
        label="Sales Volume"
        value="$100K-5M"
        onRemove={() => {}}
      />
      <FilterBadge
        variant="pill"
        label="Status"
        value="Closed"
        onRemove={() => {}}
      />
    </div>
  )
}
