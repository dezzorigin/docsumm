import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-[640px] mx-auto px-6 pt-[60px] pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full text-xs font-medium mb-6"
             style={{ 
               backgroundColor: 'var(--accent-bg)', 
               color: 'var(--accent)',
               padding: '3px 9px',
               height: '22px',
               borderRadius: '999px'
             }}>
          ✨ AI-powered document analysis
        </div>
        
        <h1 className="mb-6" style={{ 
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(30px, 7vw, 46px)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.15
        }}>
          Any document.<br />Instant clarity.
        </h1>
        
        <p className="text-[15px] leading-relaxed mb-8" style={{ color: 'var(--text-2)' }}>
          Upload any document—PDF, photo, or scan. Get structured summaries in seconds. 
          No manual reading required.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/auth/register"
            className="text-white font-medium transition-all hover:opacity-90"
            style={{ 
              backgroundColor: 'var(--accent)',
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            Get Started Free
          </Link>
          <Link 
            href="/auth/login"
            className="font-medium transition-all border"
            style={{ 
              borderColor: 'var(--border-2)',
              color: 'var(--text-1)',
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: 'transparent'
            }}
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Stats Row */}
      <section className="max-w-[900px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center border" style={{ 
            backgroundColor: 'var(--bg-2)',
            borderColor: 'var(--border)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div className="text-3xl font-bold mb-2" style={{ 
              fontFamily: 'var(--font-display)',
              color: 'var(--accent)'
            }}>8s</div>
            <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>Average summary time</p>
          </div>
          <div className="text-center border" style={{ 
            backgroundColor: 'var(--bg-2)',
            borderColor: 'var(--border)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div className="text-3xl font-bold mb-2" style={{ 
              fontFamily: 'var(--font-display)',
              color: 'var(--accent)'
            }}>97%</div>
            <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>OCR accuracy</p>
          </div>
          <div className="text-center border" style={{ 
            backgroundColor: 'var(--bg-2)',
            borderColor: 'var(--border)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div className="text-3xl font-bold mb-2" style={{ 
              fontFamily: 'var(--font-display)',
              color: 'var(--accent)'
            }}>40+</div>
            <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>Document types supported</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-[900px] mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-display)' }}>
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 border" style={{ 
            borderColor: 'var(--border)',
            borderRadius: '10px'
          }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold"
                 style={{ 
                   backgroundColor: 'var(--accent-bg)', 
                   color: 'var(--accent)',
                   fontFamily: 'var(--font-display)'
                 }}>
              1
            </div>
            <h3 className="font-semibold mb-2 text-[16px]" style={{ fontWeight: 600 }}>Upload</h3>
            <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
              Drop your PDF, photo, or scanned document. We support 40+ file types.
            </p>
          </div>
          
          <div className="text-center p-6 border" style={{ 
            borderColor: 'var(--border)',
            borderRadius: '10px'
          }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold"
                 style={{ 
                   backgroundColor: 'var(--accent-bg)', 
                   color: 'var(--accent)',
                   fontFamily: 'var(--font-display)'
                 }}>
              2
            </div>
            <h3 className="font-semibold mb-2 text-[16px]" style={{ fontWeight: 600 }}>AI Analysis</h3>
            <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
              Our AI extracts text via OCR and generates a structured summary automatically.
            </p>
          </div>
          
          <div className="text-center p-6 border" style={{ 
            borderColor: 'var(--border)',
            borderRadius: '10px'
          }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold"
                 style={{ 
                   backgroundColor: 'var(--accent-bg)', 
                   color: 'var(--accent)',
                   fontFamily: 'var(--font-display)'
                 }}>
              3
            </div>
            <h3 className="font-semibold mb-2 text-[16px]" style={{ fontWeight: 600 }}>Get Results</h3>
            <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
              Review structured insights: overview, critical points, action items, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          © 2026 DocSumm. Built with Next.js, Supabase, and AI.
        </p>
      </footer>
    </div>
  )
}
