export default function ReturnsLoading() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full mx-auto animate-pulse" />
            <div className="h-12 bg-muted rounded w-2/3 mx-auto animate-pulse" />
            <div className="h-6 bg-muted rounded w-1/2 mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
