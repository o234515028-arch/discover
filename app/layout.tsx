import type { Metadata, Viewport } from 'next';
import './globals.css';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#306e50'};
export const metadata:Metadata={title:'Bulancak’ta — Mahalleni keşfet',description:'Bulancak için yerler, etkinlikler ve mahalle sohbetleri. Etkileşimli keşif prototipi.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}

