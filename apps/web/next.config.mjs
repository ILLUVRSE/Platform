/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@illuvrse/ui", "@illuvrse/agent-manager", "@illuvrse/contracts", "@illuvrse/db"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "**.srcdn.com" },
      { protocol: "https", hostname: "**.mashable.com" },
      { protocol: "https", hostname: "**.yimg.com" },
      { protocol: "https", hostname: "**.cbrimages.com" },
      { protocol: "https", hostname: "**.alphacoders.com" },
      { protocol: "https", hostname: "**.hdqwalls.com" },
      { protocol: "https", hostname: "**.squarespace-cdn.com" },
      { protocol: "https", hostname: "**.wikia.nocookie.net" },
      { protocol: "https", hostname: "**.ytimg.com" },
      { protocol: "https", hostname: "**.twitter.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "**.technplay.com" },
      { protocol: "https", hostname: "technplay.com" },
      { protocol: "https", hostname: "**.dondon.media" },
      { protocol: "https", hostname: "dondon.media" },
      { protocol: "https", hostname: "**.wallpapersden.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "dwstream4-lh.akamaihd.net" },
      { protocol: "https", hostname: "cbcliveradio-lh.akamaihd.net" },
      { protocol: "https", hostname: "av.rasset.ie" },
      { protocol: "https", hostname: "live.kexp.org" },
      { protocol: "https", hostname: "stream.live.vc.bbcmedia.co.uk" },
      { protocol: "https", hostname: "npr-ice.streamguys1.com" },
      { protocol: "https", hostname: "stream11.tdiradio.com" },
      { protocol: "https", hostname: "kqed-ice.streamguys1.com" },
      { protocol: "https", hostname: "scpr-ice.streamguys1.com" },
      { protocol: "https", hostname: "wbur-live.streamguys1.com" },
      { protocol: "https", hostname: "wamu-1.streamguys1.com" },
      { protocol: "https", hostname: "wbez-live.streamguys1.com" },
      { protocol: "https", hostname: "radionz-ice.streamguys1.com" },
      { protocol: "https", hostname: "live-radio01.mediahubaustralia.com" }
    ]
  }
};

export default nextConfig;
