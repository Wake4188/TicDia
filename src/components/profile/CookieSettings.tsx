import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Cookie, ShieldCheck, BarChart3, Settings as SettingsIcon } from "lucide-react";

/**
 * Detailed privacy & cookie controls.
 * - Essential: always on (login session, theme, language, consent record).
 * - Analytics: Google Analytics (anonymised IP). Loaded only when enabled.
 *   Disabling stops future GA loading and clears any _ga* cookies on this domain.
 * - Preferences: client-side settings such as saved feed, custom RSS, reading
 *   preferences. Stored locally only — turning off clears them.
 */
export const CookieSettings = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    setAnalytics(localStorage.getItem("cookie-consent") === "accepted");
    setPreferences(localStorage.getItem("cookie-preferences") !== "declined");
  }, []);

  const clearGaCookies = () => {
    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        if (name.startsWith("_ga") || name === "_gid") {
          const domains = [window.location.hostname, "." + window.location.hostname];
          domains.forEach((d) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
          });
        }
      });
    } catch {}
  };

  const updateAnalytics = (next: boolean) => {
    setAnalytics(next);
    if (next) {
      localStorage.setItem("cookie-consent", "accepted");
      try { window.dispatchEvent(new Event("ticdia:consent-accepted")); } catch {}
      toast({ title: "Analytics enabled", description: "Anonymous usage data will help improve TicDia." });
    } else {
      localStorage.setItem("cookie-consent", "declined");
      clearGaCookies();
      toast({ title: "Analytics disabled", description: "Existing analytics cookies were cleared. Reload to fully unload the tracker." });
    }
  };

  const updatePreferences = (next: boolean) => {
    setPreferences(next);
    if (next) {
      localStorage.removeItem("cookie-preferences");
      toast({ title: "Preference storage enabled" });
    } else {
      localStorage.setItem("cookie-preferences", "declined");
      // Clear opt-in client preferences (keep auth + consent records)
      const keep = new Set(["cookie-consent", "cookie-preferences", "sb-rtuxaekhfwvpwmvmdaul-auth-token"]);
      Object.keys(localStorage).forEach((k) => {
        if (!keep.has(k) && !k.startsWith("sb-")) localStorage.removeItem(k);
      });
      toast({ title: "Preference storage disabled", description: "Local app preferences were cleared." });
    }
  };

  const Row = ({
    icon: Icon,
    title,
    description,
    bullets,
    enabled,
    onChange,
    locked,
  }: {
    icon: any;
    title: string;
    description: string;
    bullets: string[];
    enabled: boolean;
    onChange?: (v: boolean) => void;
    locked?: boolean;
  }) => (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Icon className="w-5 h-5 mt-0.5 text-primary shrink-0" />
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onChange} disabled={locked} />
      </div>
      <ul className="text-xs text-muted-foreground space-y-1 pl-8 list-disc">
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </div>
  );

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Cookie className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Privacy & Cookie Settings</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Detailed control over what TicDia stores on your device. Changes apply immediately.
        Required under the EU ePrivacy Directive (the "Cookie Law") and the GDPR.
      </p>

      <Row
        icon={ShieldCheck}
        title="Strictly necessary"
        description="Required for the site to function. Cannot be disabled."
        enabled={true}
        locked
        bullets={[
          "Authentication session (Supabase auth token, ~1 week)",
          "Theme and language preference (so the site doesn't flash on reload)",
          "Your cookie consent record itself",
          "If disabled: you cannot sign in or use the site",
        ]}
      />

      <Row
        icon={BarChart3}
        title="Analytics"
        description="Google Analytics 4 with IP anonymisation. Helps us understand which features people use."
        enabled={analytics}
        onChange={updateAnalytics}
        bullets={[
          "Cookies set: _ga, _ga_*, _gid (Google Analytics)",
          "Data collected: page views, country (not city), device type, anonymised IP",
          "No personal identifiers, no cross-site tracking, no ad profiling",
          "If disabled: the GA script is not loaded and existing _ga cookies are cleared",
        ]}
      />

      <Row
        icon={SettingsIcon}
        title="Preferences & functionality"
        description="Remembers things you've configured (custom RSS feed, reading settings, dismissed dialogs)."
        enabled={preferences}
        onChange={updatePreferences}
        bullets={[
          "Stored in localStorage on this device only — never sent to a server",
          "Examples: custom news source URL, font size, TTS speed, last-seen announcement",
          "If disabled: these settings are cleared and the site reverts to defaults",
        ]}
      />

      <div className="pt-2 border-t border-border flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Want the full policy?</span>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        </Button>
        <span>·</span>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>
        </Button>
      </div>
    </Card>
  );
};

export default CookieSettings;
