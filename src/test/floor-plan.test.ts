import { describe, expect, it } from "vitest";

import { isPartnerCafe } from "@/lib/firebase-service";
import { defaultFloorSeats, timesOverlap, withFloorPlan, type Seat } from "@/lib/workspot-data";

describe("floor plan layout", () => {
  it("gives every default seat a unique id and a position inside the plan", () => {
    const seats = defaultFloorSeats();

    expect(seats.length).toBe(42);
    expect(new Set(seats.map((s) => s.id)).size).toBe(seats.length);
    for (const seat of seats) {
      expect(seat.x).toBeGreaterThan(0);
      expect(seat.x).toBeLessThan(100);
      expect(seat.y).toBeGreaterThan(0);
      expect(seat.y).toBeLessThan(100);
    }
  });

  it("replaces legacy grid seats with the default layout but keeps custom layouts", () => {
    const legacy: Seat[] = [{ id: "s1", name: "Window 1", type: "Window", status: "available", x: 12, y: 12 }];
    const custom: Seat[] = [{ id: "s1", name: "Mine", type: "single", status: "available", x: 20, y: 20, tableId: "custom" }];

    expect(withFloorPlan({ seats: legacy }).seats.length).toBe(42);
    expect(withFloorPlan({ seats: custom }).seats).toEqual(custom);
  });
});

describe("booking time overlap", () => {
  it("detects overlapping and back-to-back bookings", () => {
    expect(timesOverlap("10:00", 2, "11:00", 1)).toBe(true);
    expect(timesOverlap("10:00", 2, "12:00", 1)).toBe(false);
    expect(timesOverlap("10:00", 1, "09:00", 1)).toBe(false);
    expect(timesOverlap("09:00", 3, "10:00", 1)).toBe(true);
  });
});

describe("partner cafés", () => {
  it("treats OpenStreetMap-only cafés as non-partners", () => {
    expect(isPartnerCafe({ source: "osm" })).toBe(false);
    expect(isPartnerCafe({})).toBe(true);
  });
});
