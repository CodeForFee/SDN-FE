'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { VehicleColor } from '@/services/vehicleColorService'
import { motion } from 'framer-motion';
import { Search, Car, GitCompare, Palette } from 'lucide-react';
import Link from 'next/link';
import { getImageUrl, isAbsoluteImageUrl } from '@/lib/imageUtils';
import Image from 'next/image';

// Hàm để hiển thị tên Model (tách riêng cho code sạch hơn)
const getModelName = (model: Vehicle['model']): string => {
  return typeof model === 'string' ? model : model?.name || 'N/A';
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        // Đảm bảo vehicleService.getVehicles() trả về type Vehicle[] mới
        const data = await vehicleService.getVehicles();
        setVehicles(data);
        setFilteredVehicles(data);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const filtered = vehicles.filter((v) => {
      const modelStr = getModelName(v.model);
      const trimStr = v.trim || '';
      return (
        modelStr.toLowerCase().includes(search.toLowerCase()) ||
        trimStr.toLowerCase().includes(search.toLowerCase())
      );
    });
    setFilteredVehicles(filtered);
  }, [search, vehicles]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vehicle Catalog</h1>
            <p className="text-muted-foreground">Browse our available vehicles</p>
          </div>
          <Link href="/vehicles/compare">
            <Button>
              <GitCompare className="mr-2 h-4 w-4" />
              Compare
            </Button>
          </Link>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardHeader>
                  <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    {(() => {
                      const imageUrl = getImageUrl(vehicle.images?.[0]);
                      if (!imageUrl) {
                        return <Car className="h-12 w-12 text-muted-foreground" />;
                      }
                      
                      const isAbsolute = isAbsoluteImageUrl(imageUrl);
                      const alt = getModelName(vehicle.model);
                      
                      return isAbsolute ? (
                        <img
                          src={imageUrl}
                          alt={alt}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <Image
                          src={imageUrl}
                          alt={alt}
                          width={400}
                          height={300}
                          className="rounded-xl object-cover"
                          unoptimized={imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                          }}
                        />
                      );
                    })()}
                    <div className="fallback hidden absolute">
                      <Car className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">
                    {getModelName(vehicle.model)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.trim || 'N/A'}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-4">
                    {/* Hiển thị chi tiết thông số */}
                    <div className="text-sm space-y-1">
                      {vehicle.battery && (
                        <p><strong>Battery:</strong> {vehicle.battery}</p>
                      )}
                      {vehicle.range && (
                        <p><strong>Range:</strong> {vehicle.range} km</p>
                      )}
                      {vehicle.motorPower && (
                        <p><strong>Motor Power:</strong> {vehicle.motorPower} kW</p>
                      )}
                    </div>

                    {/* HIỂN THỊ MÀU SẮC */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold flex items-center gap-2">
                            <Palette className="h-4 w-4 text-muted-foreground" />
                            Available Colors:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {vehicle.colors && vehicle.colors.length > 0 ? (
                                vehicle.colors.slice(0, 5).map((color: VehicleColor) => (
                                    <div 
                                        key={color._id} 
                                        className="h-6 w-6 rounded-full border border-gray-300 shadow-sm"
                                        style={{ backgroundColor: color.hex || '#ffffff' }}
                                        title={`${color.name} (${color.hex})`}
                                    />
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground">No colors available.</span>
                            )}
                            {vehicle.colors && vehicle.colors.length > 5 && (
                                <span className="text-xs text-muted-foreground self-end">+{vehicle.colors.length - 5} more</span>
                            )}
                        </div>
                    </div>
                    {/* Kết thúc Hiển thị màu sắc */}

                    <div className="flex items-center gap-2">
                      <Badge variant={vehicle.active !== false ? 'default' : 'secondary'}>
                        {vehicle.active !== false ? 'active' : 'inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Footer & Buttons */}
                  <div className="space-y-3 mt-auto">
                    <div className="text-2xl font-bold break-words">${(vehicle.msrp || 0).toLocaleString()}</div>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/vehicles/compare?ids=${vehicle._id}`} className="flex-1 min-w-[100px]">
                        <Button variant="outline" size="sm" className="w-full">
                          <GitCompare className="mr-2 h-4 w-4" />
                          Compare
                        </Button>
                      </Link>
                      <Link href={`/vehicles/${vehicle._id}`} className="flex-1 min-w-[100px]">
                        <Button size="sm" className="w-full">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}