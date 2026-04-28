import type { Metadata } from 'next';
import { decompressFromEncodedURIComponent } from 'lz-string';

function metersToMiles(m: number): number {
  return m * 0.000621371;
}

export async function generateMetadata({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const compressed = resolvedParams?.data;

  if (compressed && typeof compressed === 'string') {
    try {
      const json = decompressFromEncodedURIComponent(compressed);
      if (json) {
        const route = JSON.parse(json);
        const name = route.name || 'Route';
        const distance = route.distance
          ? `${metersToMiles(route.distance).toFixed(1)} mi`
          : '';
        const description = distance
          ? `${name} — ${distance} exercise route on Routesmith`
          : `${name} on Routesmith`;

        return {
          title: `${name} | Routesmith`,
          description,
          openGraph: {
            title: `${name} | Routesmith`,
            description,
            type: 'website',
            siteName: 'Routesmith',
          },
          twitter: {
            card: 'summary',
            title: `${name} | Routesmith`,
            description,
          },
        };
      }
    } catch {
      // fall through to default
    }
  }

  return {
    title: 'Route Detail | Routesmith',
    description: 'View route details on Routesmith — personalized exercise routes.',
    openGraph: {
      title: 'Route Detail | Routesmith',
      description: 'View route details on Routesmith — personalized exercise routes.',
      type: 'website',
      siteName: 'Routesmith',
    },
    twitter: {
      card: 'summary',
    },
  };
}

export default function RouteDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
