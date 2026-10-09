import { notFound } from "next/navigation";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { source } from "@/lib/source";
import { resolvePageDetails } from "@/lib/docs-index";
import { Mermaid } from "@/components/mermaid";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const details = resolvePageDetails(page);
  const title = page.data.title || details.title;
  const description = page.data.description || details.description;
  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{title}</DocsTitle>
      {description ? <DocsDescription>{description}</DocsDescription> : null}
      <DocsBody>
        {typeof MDX === "function" ? (
          <MDX components={{ ...defaultMdxComponents, Mermaid }} />
        ) : (
          <div>
            <p>{description || details.content}</p>
          </div>
        )}
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return {
      title: "Not Found",
    };
  }

  const details = resolvePageDetails(page);

  return {
    title: page.data.title || details.title,
    description: page.data.description || details.description,
  };
}
