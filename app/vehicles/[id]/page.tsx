'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Car, GitCompare } from 'lucide-react';
import { getImageUrl, isAbsoluteImageUrl } from '@/lib/imageUtils';

export default function VehicleDetailPage() {
  const params = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const data = await vehicleService.getVehicleById(params.id as string);
        setVehicle(data);
      } catch (error) {
        console.error('Failed to fetch vehicle:', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchVehicle();
    }
  }, [params.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    );
  }

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Vehicle not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Link href="/vehicles" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Vehicles
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-6">
              <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                {(() => {
                  const imageUrl = getImageUrl(vehicle.images?.[0]);
                  if (!imageUrl) {
                    return <Car className="h-24 w-24 text-muted-foreground" />;
                  }
                  
                  const isAbsolute = isAbsoluteImageUrl(imageUrl);
                  const alt = typeof vehicle.model === 'string' ? vehicle.model : vehicle.model?.name || 'Vehicle';
                  
                  return isAbsolute ? (
                    <img
                      src={imageUrl}
                      alt={alt}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.fallback');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <Image
                      src={imageUrl}
                      alt={alt}
                      width={600}
                      height={400}
                      className="rounded-xl object-cover"
                      unoptimized={imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.fallback');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  );
                })()}
                <div className="fallback hidden absolute">
                  <Car className="h-24 w-24 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {typeof vehicle.model === 'string' ? vehicle.model : vehicle.model?.name || 'N/A'}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {vehicle.trim || 'N/A'}
              </p>
              {typeof vehicle.model === 'object' && vehicle.model?.brand && (
                <p className="text-sm text-muted-foreground mb-2">
                  Brand: {vehicle.model.brand}
                </p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={vehicle.active !== false ? 'default' : 'secondary'}>
                  {vehicle.active !== false ? 'active' : 'inactive'}
                </Badge>
              </div>
              <p className="text-3xl font-bold text-primary mb-6">
                ${(vehicle.msrp || 0).toLocaleString()}
              </p>
            </div>

            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vehicle.battery && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Battery</span>
                    <span className="font-medium">{vehicle.battery}</span>
                  </div>
                )}
                {vehicle.range && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Range</span>
                    <span className="font-medium">{vehicle.range} km</span>
                  </div>
                )}
                {vehicle.motorPower && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Motor Power</span>
                    <span className="font-medium">{vehicle.motorPower} kW</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {vehicle.features && vehicle.features.length > 0 && (
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {vehicle.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                <Link href={`/vehicles/compare?ids=${vehicle._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <GitCompare className="mr-2 h-4 w-4" />
                    Add to Compare
                  </Button>
                </Link>
                <Link href={`/quotes/new?vehicle=${vehicle._id}`} className="flex-1">
                  <Button className="w-full">Create Quote</Button>
                </Link>
              </div>
              <Link href={`/orders/new?vehicle=${vehicle._id}`} className="w-full block">
                <Button variant="outline" className="w-full">Create Order</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

