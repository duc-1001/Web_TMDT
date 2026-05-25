import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function HeroPreviewModal({ hero, onClose }: any) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <div className="relative h-[420px]">
          <img
            src={hero.image}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-10 p-12 max-w-xl">
            <h1 className="text-4xl font-bold mb-4 text-white">
              {hero.title}
            </h1>
            <p className="text-white/90 mb-6">
              {hero.subtitle}
            </p>
            <Button size="lg">Mua sắm ngay</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
