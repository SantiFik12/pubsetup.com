"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ZoomIn } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function ProductGallery({ photos, name }: { photos: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>();
  const [enlarged, setEnlarged] = useState(false);

  useEffect(() => {
    if (!mainApi) return;
    const sync = () => {
      const index = mainApi.selectedScrollSnap();
      setSelected(index);
      thumbApi?.scrollTo(index, true);
    };
    sync();
    mainApi.on("select", sync);
    mainApi.on("reInit", sync);
    return () => { mainApi.off("select", sync); mainApi.off("reInit", sync); };
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (enlarged && lightboxApi) lightboxApi.scrollTo(selected, true);
    // Start the lightbox at the current photo when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enlarged, lightboxApi]);

  useEffect(() => {
    if (!lightboxApi || !enlarged) return;
    const sync = () => mainApi?.scrollTo(lightboxApi.selectedScrollSnap(), true);
    lightboxApi.on("select", sync);
    return () => { lightboxApi.off("select", sync); };
  }, [lightboxApi, mainApi, enlarged]);

  return <>
    <div data-testid="product-gallery" className="min-w-0 lg:sticky lg:top-24">
      <Carousel setApi={setMainApi} opts={{ loop: true }} aria-label={`${name} images`}>
        <CarouselContent className="ml-0">
          {photos.map((photo, index) => <CarouselItem key={photo} className="pl-0">
            <button type="button" onClick={() => setEnlarged(true)} aria-label={`Enlarge image ${index + 1} of ${name}`} tabIndex={index === selected ? 0 : -1} className="ring-focus group relative block aspect-[1.36] w-full bg-surface">
              <Image src={photo} alt={index === 0 ? name : `${name} — screenshot ${index + 1}`} title={index === 0 ? name : `${name} — screenshot ${index + 1}`} fill sizes="(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw" quality={85} loading={index === 0 ? "eager" : "lazy"} unoptimized={photo.startsWith("http:")} className="object-contain" />
              <span className="absolute left-3 bottom-3 rounded-full bg-white/90 p-2 text-foreground opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"><ZoomIn className="h-4 w-4" /></span>
            </button>
          </CarouselItem>)}
        </CarouselContent>
        <span role="status" aria-label="Current image" className="pointer-events-none absolute bottom-5 right-4 rounded-full bg-white/95 px-3 py-1 text-sm tabular-nums text-black">{selected + 1}/{photos.length}</span>
      </Carousel>
      {photos.length > 1 && <Carousel setApi={setThumbApi} opts={{ align: "start", containScroll: "trimSnaps", slidesToScroll: 1 }} className="mt-4" aria-label="Product screenshots">
        <CarouselContent className="-ml-1">
          {photos.map((photo, index) => <CarouselItem key={photo} className="basis-1/3 pl-1">
            <button type="button" onClick={() => mainApi?.scrollTo(index)} aria-label={`Show image ${index + 1}`} aria-pressed={index === selected} className={`ring-focus relative block aspect-[1.36] w-full overflow-hidden rounded-[2px] border bg-surface ${index === selected ? "border-black" : "border-transparent hover:border-muted-foreground/50"}`}>
              <Image src={photo} alt="" fill sizes="(min-width: 1280px) 200px, (min-width: 1024px) 16vw, 33vw" unoptimized={photo.startsWith("http:")} className="object-contain" />
            </button>
          </CarouselItem>)}
        </CarouselContent>
        <button type="button" onClick={() => mainApi?.scrollPrev()} aria-label="Previous image" className="ring-focus absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm bg-slate-600/50 text-white hover:bg-slate-600/75"><ArrowLeft className="h-5 w-5" /></button>
        <button type="button" onClick={() => mainApi?.scrollNext()} aria-label="Next image" className="ring-focus absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm bg-slate-600/50 text-white hover:bg-slate-600/75"><ArrowRight className="h-5 w-5" /></button>
      </Carousel>}
    </div>
    <Dialog open={enlarged} onOpenChange={setEnlarged}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-5xl border-none bg-background p-3 shadow-pop">
        <DialogTitle className="sr-only">{name} screenshots</DialogTitle>
        <DialogDescription className="sr-only">Browse the product images with the previous and next buttons.</DialogDescription>
        <Carousel setApi={setLightboxApi} opts={{ loop: true, startIndex: selected }} aria-label="Enlarged product images">
          <CarouselContent>{photos.map((photo, index) => <CarouselItem key={photo} className="flex items-center justify-center"><div className="relative h-[75vh] max-h-[740px] w-full"><Image src={photo} alt={`${name} — screenshot ${index + 1}`} title={`${name} — screenshot ${index + 1}`} fill sizes="(min-width: 1024px) 1000px, 100vw" quality={85} unoptimized={photo.startsWith("http:")} className="object-contain" /></div></CarouselItem>)}</CarouselContent>
          {photos.length > 1 && <><CarouselPrevious className="left-2 bg-background/90" /><CarouselNext className="right-2 bg-background/90" /></>}
        </Carousel>
      </DialogContent>
    </Dialog>
  </>;
}
