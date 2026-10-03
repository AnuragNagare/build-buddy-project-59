import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ButtonLink } from "./ui/button";

const links = [{ to: "/explore", label: "Explore" }, { to: "/how-it-works", label: "How it works" }, { to: "/partners", label: "For cafés" }] as const;
export function Logo() { return <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><BriefcaseBusiness size={19} /></span>WorkSpot<span className="text-coral">.</span></Link>; }
export function AppShell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-background text-foreground">
    {!bare && <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto grid h-18 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center px-4 sm:px-6 lg:px-8">
        <Logo /><nav className="hidden items-center gap-7 md:flex">{links.map((item) => <Link key={item.to} to={item.to} className="text-sm font-semibold text-muted-foreground hover:text-foreground" activeProps={{ className: "text-primary" }}>{item.label}</Link>)}<Link to="/account/bookings" className="text-sm font-semibold text-muted-foreground hover:text-foreground">My bookings</Link><ButtonLink to="/explore">Find a WorkSpot</ButtonLink></nav>
        <button aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)} className="grid size-11 place-items-center rounded-lg border border-border bg-card md:hidden">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav className="border-t border-border bg-card px-4 py-5 md:hidden">{links.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="block py-3 text-lg font-bold">{item.label}</Link>)}<Link to="/account/bookings" className="block py-3 text-lg font-bold">My bookings</Link><ButtonLink to="/explore" search={{}} className="mt-3 w-full">Find a WorkSpot</ButtonLink></nav>}
    </header>}
    <main>{children}</main>
    {!bare && <footer className="bg-foreground text-primary-foreground"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4"><div className="md:col-span-2"><Logo /><p className="mt-4 max-w-sm text-sm text-primary-foreground/65">Better workdays, one neighbourhood café at a time. Built for India, starting in Mumbai.</p></div><div><p className="font-bold">Discover</p><Link to="/explore" search={{}} className="mt-3 block text-sm opacity-70">Explore cafés</Link><Link to="/how-it-works" className="mt-2 block text-sm opacity-70">How it works</Link></div><div><p className="font-bold">WorkSpot</p><Link to="/partners" className="mt-3 block text-sm opacity-70">List your café</Link><Link to="/manager" className="mt-2 block text-sm opacity-70">Manager demo</Link></div></div><div className="border-t border-primary-foreground/10 px-5 py-5 text-center text-xs text-primary-foreground/50">© 2026 WorkSpot · Fictional venues for demonstration</div></footer>}
  </div>;
}
