import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Bulancak’ta — Mahalleni keşfet',description:'Bulancak için yerler, etkinlikler ve mahalle sohbetleri. Etkileşimli keşif prototipi.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}
