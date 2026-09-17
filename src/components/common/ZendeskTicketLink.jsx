import {
  buildZendeskTicketUrl,
  getZendeskTicketDisplay,
} from "../../utils/zendesk";

export default function ZendeskTicketLink({
  value,
  className = "",
  showExternalHint = false,
}) {
  const href = buildZendeskTicketUrl(value);
  const label = getZendeskTicketDisplay(value);

  if (!href) {
    return <span className={className}>{label}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "font-black text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-sky-700 hover:decoration-sky-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={`Open Zendesk ticket ${label}`}
    >
      {label}
      {showExternalHint ? (
        <span className="sr-only"> (opens Zendesk)</span>
      ) : null}
    </a>
  );
}
