"use client"

import { useEffect, useRef } from "react"
import JsBarcode from "jsbarcode"

interface OfficialBarcodeProps {
  value: string
  className?: string
}

export function OfficialBarcode({ value, className }: OfficialBarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!svgRef.current || !value) return

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: 56,
        width: 2,
        background: "transparent",
        lineColor: "#111111",
      })
    } catch {
      // If barcode cannot be rendered, keep empty fallback.
    }
  }, [value])

  return <svg ref={svgRef} className={className} role="img" aria-label="Official payment barcode" />
}