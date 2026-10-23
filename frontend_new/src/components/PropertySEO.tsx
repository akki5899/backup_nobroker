import Head from 'next/head';
import { Property } from '@/types';

interface PropertySEOProps {
  property: Property;
}

export default function PropertySEO({ property }: PropertySEOProps) {
  const imageUrl = property.images?.[0]?.image_url
    ? `http://localhost:8000/${property.images[0].image_url}`
    : 'http://localhost:3000/default-property.jpg';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description,
    "url": `http://localhost:3000/properties/${property.id}`,
    "image": imageUrl,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.address,
      "addressLocality": property.city,
      "addressRegion": property.state,
      "postalCode": property.pincode,
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": (property as any).latitude,
      "longitude": (property as any).longitude
    },
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "INR",
      "availability": property.is_active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "numberOfRooms": property.bedrooms,
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "FTK"
    }
  };

  return (
    <Head>
      <title>{property.title} | NoBroker</title>
      <meta name="description" content={property.description || `${property.bedrooms} BHK ${property.type} in ${property.city}`} />
      <meta name="keywords" content={`${property.city}, ${property.type}, ${property.listing_type}, real estate, property`} />

      {/* Open Graph */}
      <meta property="og:title" content={property.title} />
      <meta property="og:description" content={property.description || ''} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={`http://localhost:3000/properties/${property.id}`} />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={property.title} />
      <meta name="twitter:description" content={property.description || ''} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}
