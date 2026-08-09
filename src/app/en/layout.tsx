export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>
    <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='en';" }} />
    {children}
  </>;
}
