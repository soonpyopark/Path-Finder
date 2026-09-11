export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (typeof window === "undefined") return null;

  const kakaoMaps = window.kakao?.maps;
  if (!kakaoMaps?.services || !address.trim()) return null;

  return new Promise((resolve) => {
    const geocoder = new kakaoMaps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status === "OK" && result[0]) {
        resolve({
          lat: Number(result[0].y),
          lng: Number(result[0].x),
        });
        return;
      }
      resolve(null);
    });
  });
}

export async function ensureCoordinates<T extends { address: string; lat: number | null; lng: number | null }>(
  items: T[],
): Promise<T[]> {
  const resolved = await Promise.all(
    items.map(async (item) => {
      if (item.lat !== null && item.lng !== null) return item;
      const coords = await geocodeAddress(item.address);
      if (!coords) return item;
      return { ...item, lat: coords.lat, lng: coords.lng };
    }),
  );

  return resolved;
}
