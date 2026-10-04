import React, { lazy } from 'react';

const Home = lazy(() => import('../pages/Home'));
const NotFound = lazy(() => import('../pages/NotFound'));
const About = lazy(() => import('../pages/About'));
const Services = lazy(() => import('../pages/Services'));
const ServiceDetail = lazy(() => import('../pages/ServiceDetail'));
const Teambuilding = lazy(() => import('../pages/Teambuilding'));
const TrackApplication = lazy(() => import('../pages/TrackApplication'));
const Catering = lazy(() => import('../pages/Catering'));
const TV = lazy(() => import('../pages/TV'));
const Eventgarden = lazy(() => import('../pages/Eventgarden'));
const Portfolio = lazy(() => import('../pages/Portfolio'));
const Gallery = lazy(() => import('../pages/Gallery'));
const Contact = lazy(() => import('../pages/Contact'));
const Catalog = lazy(() => import('../pages/Catalog'));
const CatalogCategory = lazy(() => import('../pages/CatalogCategory'));
const ProductDetail = lazy(() => import('../pages/ProductDetail'));
const Cart = lazy(() => import('../pages/Cart'));
const Admin = lazy(() => import('../pages/Admin'));
const Login = lazy(() => import('../pages/Login'));
const Profile = lazy(() => import('../pages/Profile'));
const Premium = lazy(() => import('../pages/Premium'));

export const appRoutes: { path: string; element: React.ReactElement }[] = [
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
  { path: '/services', element: <Services /> },
  { path: '/services/:category', element: <ServiceDetail /> },
  { path: '/services/:category/:id', element: <ServiceDetail /> },
  { path: '/teambuilding', element: <Teambuilding /> },
  { path: '/track/:order_no', element: <TrackApplication /> },
  { path: '/catering', element: <Catering /> },
  { path: '/tv', element: <TV /> },
  { path: '/eventgarden', element: <Eventgarden /> },
  { path: '/portfolio', element: <Portfolio /> },
  { path: '/gallery', element: <Gallery /> },
  { path: '/contact', element: <Contact /> },
  { path: '/catalog', element: <Catalog /> },
  { path: '/catalog/:category', element: <CatalogCategory /> },
  { path: '/product/:id', element: <ProductDetail /> },
  { path: '/cart', element: <Cart /> },
  { path: '/admin', element: <Admin /> },
  { path: '/login', element: <Login /> },
  { path: '/profile', element: <Profile /> },
  { path: '/premium', element: <Premium /> },
  { path: '*', element: <NotFound /> },
];