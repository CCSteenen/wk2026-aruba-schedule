interface Props {
  code: string;
  name?: string;
}

export function TeamBadge({ code, name }: Props) {
  return (
    <span className="teamBadge" title={name || code}>
      <span className="codeDot">{code.slice(0, 3)}</span>
      {name && <span className="teamName">{name}</span>}
    </span>
  );
}
