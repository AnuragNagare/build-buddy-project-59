import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FloorPlanCanvas, SeatLegendRow, seatKindIcons, seatMarkerClass } from "@/components/booking-ui";
import { Button } from "@/components/ui/button";
import { defaultFloorSeats, seatKindLabels, type Seat, type SeatKind } from "@/lib/workspot-data";
import { cn } from "@/lib/utils";

const clamp = (value: number) => Math.min(97, Math.max(3, Math.round(value * 10) / 10));

/**
 * Lets a café lay out its seats on the floor plan: drag chairs into place, add or remove chairs,
 * rename them, change their type, and switch individual chairs off ("not offered").
 */
export function FloorPlanEditor({
  seats,
  onChange,
}: {
  seats: Seat[];
  onChange: (seats: Seat[]) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<SeatKind>("single");

  const update = (id: string, patch: Partial<Seat>) =>
    onChange(seats.map((seat) => (seat.id === id ? { ...seat, ...patch } : seat)));

  const addSeat = () => {
    let n = seats.length + 1;
    while (seats.some((seat) => seat.id === `s${n}`)) n += 1;
    // Drop the new chair near the middle, offset so repeated adds don't stack exactly
    const offset = (seats.length % 5) * 3;
    const seat: Seat = {
      id: `s${n}`,
      name: `${seatKindLabels[newKind].label} ${n}`,
      type: newKind,
      status: "available",
      x: 50 + offset,
      y: 50 + offset,
      tableId: "custom",
    };
    onChange([...seats, seat]);
    setActiveId(seat.id);
  };

  const removeSeat = (id: string) => {
    onChange(seats.filter((seat) => seat.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    update(dragId, {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100),
    });
  };

  const offered = seats.filter((seat) => seat.status !== "not-offered").length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SeatLegendRow />
          <span className="text-xs font-bold text-muted-foreground">
            {seats.length} seats · {offered} offered
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Drag a chair to move it. Click a chair to edit it.</p>
        <div className="mt-3 touch-none">
          <FloorPlanCanvas
            canvasRef={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragId(null)}
          >
            {seats.map((seat) => (
              <button
                key={seat.id}
                type="button"
                aria-label={`${seat.name} — drag to move`}
                title={seat.name}
                onPointerDown={(event) => {
                  event.preventDefault();
                  setActiveId(seat.id);
                  setDragId(seat.id);
                }}
                className={cn(
                  "absolute aspect-square w-[3.1%] min-w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 shadow-md active:cursor-grabbing",
                  seatMarkerClass(seat.status === "unavailable" ? "available" : seat.status, activeId === seat.id)
                )}
                style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
              />
            ))}
          </FloorPlanCanvas>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-display text-lg font-bold">Add a seat</h3>
          <div className="mt-3 flex gap-2">
            <select
              value={newKind}
              onChange={(event) => setNewKind(event.target.value as SeatKind)}
              aria-label="Seat type"
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-sm font-semibold"
            >
              {(Object.keys(seatKindLabels) as SeatKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {seatKindLabels[kind].label}
                </option>
              ))}
            </select>
            <Button type="button" onClick={addSeat}>
              <Plus size={16} /> Add
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 px-0 text-xs"
            onClick={() => {
              if (window.confirm("Reset to the default layout? Your changes will be lost.")) {
                onChange(defaultFloorSeats());
                setActiveId(null);
              }
            }}
          >
            Reset to default layout
          </Button>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3">
          {seats.map((seat) => {
            const Icon = seatKindIcons[seat.type as SeatKind] ?? seatKindIcons.single;
            return (
              <div
                key={seat.id}
                className={cn(
                  "rounded-lg border p-2.5 text-xs",
                  activeId === seat.id ? "border-primary bg-primary/5" : "border-border bg-background"
                )}
                onClick={() => setActiveId(seat.id)}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="shrink-0 text-primary" />
                  <input
                    value={seat.name}
                    onChange={(event) => update(seat.id, { name: event.target.value })}
                    aria-label="Seat name"
                    className="min-w-0 flex-1 bg-transparent font-bold outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${seat.name}`}
                    onClick={() => removeSeat(seat.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={seat.type}
                    onChange={(event) => update(seat.id, { type: event.target.value })}
                    aria-label="Seat type"
                    className="min-w-0 flex-1 rounded border border-border bg-card px-1 py-1 font-semibold"
                  >
                    {(Object.keys(seatKindLabels) as SeatKind[]).map((kind) => (
                      <option key={kind} value={kind}>
                        {seatKindLabels[kind].label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 font-semibold text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={seat.status !== "not-offered"}
                      onChange={(event) =>
                        update(seat.id, { status: event.target.checked ? "available" : "not-offered" })
                      }
                    />
                    Offered
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
