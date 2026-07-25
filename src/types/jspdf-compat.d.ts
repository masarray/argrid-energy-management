import "jspdf";

declare module "jspdf" {
  interface jsPDF {
    setFillColor(...channels: number[]): jsPDF;
    setDrawColor(...channels: number[]): jsPDF;
    setTextColor(...channels: number[]): jsPDF;
  }
}
