'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { toast } from 'sonner';
import { ArrowLeft, X, GitCompare, Car } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getImageUrl, isAbsoluteImageUrl } from '@/lib/imageUtils';
import Image from 'next/image';

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    // Get IDs from URL params
    const idsParam = searchParams?.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      setSelectedIds(ids);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchAllVehicles = async () => {
      try {
        const all = await vehicleService.getVehicles();
        setAllVehicles(all);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      }
    };
    fetchAllVehicles();
  }, []);

  useEffect(() => {
    const fetchComparison = async () => {
      if (selectedIds.length >= 2) {
        setComparing(true);
        try {
          const compareData = await vehicleService.compareVehicles(selectedIds);
          setVehicles(Array.isArray(compareData) ? compareData : []);
        } catch (error: any) {
          console.error('Failed to compare vehicles:', error);
          toast.error(error.response?.data?.message || 'Failed to compare vehicles');
          setVehicles([]);
        } finally {
          setComparing(false);
          setLoading(false);
        }
      } else {
        // Clear comparison if less than 2 vehicles
        setVehicles([]);
        setLoading(false);
      }
    };
    fetchComparison();
  }, [selectedIds]);

  const handleAddVehicle = (vehicleId: string) => {
    if (!selectedIds.includes(vehicleId)) {
      const newIds = [...selectedIds, vehicleId];
      setSelectedIds(newIds);
      updateUrl(newIds);
    }
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    const newIds = selectedIds.filter(id => id !== vehicleId);
    setSelectedIds(newIds);
    // Immediately filter vehicles from comparison
    setVehicles(prevVehicles => prevVehicles.filter(v => v._id !== vehicleId));
    updateUrl(newIds);
  };

  const updateUrl = (ids: string[]) => {
    if (ids.length > 0) {
      router.push(`/vehicles/compare?ids=${ids.join(',')}`);
    } else {
      router.push('/vehicles/compare');
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      toast.error('Vui lòng chọn ít nhất 2 xe để so sánh');
      return;
    }

    setComparing(true);
    try {
      const compareData = await vehicleService.compareVehicles(selectedIds);
      setVehicles(Array.isArray(compareData) ? compareData : []);
      toast.success('So sánh thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to compare vehicles');
      setVehicles([]);
    } finally {
      setComparing(false);
    }
  };

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
          <div className="flex items-center gap-4">
            <Link href="/vehicles">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Compare Vehicles</h1>
              <p className="text-muted-foreground">Select vehicles to compare</p>
            </div>
          </div>
          {selectedIds.length >= 2 && (
            <Button onClick={handleCompare} disabled={comparing}>
              <GitCompare className="mr-2 h-4 w-4" />
              {comparing ? 'Comparing...' : 'Compare'}
            </Button>
          )}
        </div>

        {/* Selected Vehicles */}
        {selectedIds.length > 0 && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Selected Vehicles ({selectedIds.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {selectedIds.map((id) => {
                  const vehicle = allVehicles.find(v => v._id === id);
                  if (!vehicle) return null;
                  const modelName = typeof vehicle.model === 'object' ? vehicle.model?.name : 'Unknown';
                  
                  return (
                    <Card key={id} className="rounded-2xl p-4 min-w-[200px]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{modelName}</h4>
                          <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
                          <p className="text-lg font-bold mt-2">${(vehicle.msrp || 0).toLocaleString()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVehicle(id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Table */}
        {vehicles.length >= 2 && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Specification</TableHead>
                      {vehicles.map((vehicle) => {
                        const modelName = typeof vehicle.model === 'object' ? vehicle.model?.name : 'Unknown';
                        return (
                          <TableHead key={vehicle._id} className="text-center">
                            <div className="space-y-2">
                              {vehicle.images?.[0] && (
                                <div className="aspect-video bg-muted rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                                  {(() => {
                                    const imageUrl = getImageUrl(vehicle.images[0]);
                                    if (!imageUrl) return <Car className="h-8 w-8 text-muted-foreground" />;
                                    const isAbsolute = isAbsoluteImageUrl(imageUrl);
                                    return isAbsolute ? (
                                      <img src={imageUrl} alt={modelName} className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                      <Image src={imageUrl} alt={modelName} width={150} height={100} className="rounded-xl object-cover" unoptimized />
                                    );
                                  })()}
                                </div>
                              )}
                              <div>
                                <p className="font-bold">{modelName}</p>
                                <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
                              </div>
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Price (MSRP)</TableCell>
                      {vehicles.map((vehicle) => (
                        <TableCell key={vehicle._id} className="text-center">
                          ${(vehicle.msrp || 0).toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Battery</TableCell>
                      {vehicles.map((vehicle) => (
                        <TableCell key={vehicle._id} className="text-center">
                          {vehicle.battery || 'N/A'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Range (km)</TableCell>
                      {vehicles.map((vehicle) => (
                        <TableCell key={vehicle._id} className="text-center">
                          {vehicle.range ? `${vehicle.range} km` : 'N/A'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Motor Power (kW)</TableCell>
                      {vehicles.map((vehicle) => (
                        <TableCell key={vehicle._id} className="text-center">
                          {vehicle.motorPower ? `${vehicle.motorPower} kW` : 'N/A'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Features</TableCell>
                      {vehicles.map((vehicle) => (
                        <TableCell key={vehicle._id} className="text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {vehicle.features?.slice(0, 3).map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {vehicle.features && vehicle.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{vehicle.features.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Status</TableCell>
                      {vehicles.map((vehicle) => (
                        <TableCell key={vehicle._id} className="text-center">
                          <Badge variant={vehicle.active !== false ? 'default' : 'secondary'}>
                            {vehicle.active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Actions</TableCell>
                      {vehicles.map((vehicle) => (
                        <TableCell key={vehicle._id} className="text-center">
                          <Link href={`/vehicles/${vehicle._id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Selection */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Available Vehicles</CardTitle>
            <p className="text-sm text-muted-foreground">Click to add vehicles for comparison (minimum 2)</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allVehicles
                .filter(v => v.active !== false)
                .map((vehicle) => {
                  const modelName = typeof vehicle.model === 'object' ? vehicle.model?.name : 'Unknown';
                  const isSelected = selectedIds.includes(vehicle._id);
                  
                  return (
                    <motion.div
                      key={vehicle._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card 
                        className={`rounded-2xl shadow-md cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary' : 'hover:shadow-lg'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveVehicle(vehicle._id);
                          } else {
                            handleAddVehicle(vehicle._id);
                          }
                        }}
                      >
                        <CardHeader>
                          <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                            {vehicle.images?.[0] ? (
                              (() => {
                                const imageUrl = getImageUrl(vehicle.images[0]);
                                if (!imageUrl) return <Car className="h-12 w-12 text-muted-foreground" />;
                                const isAbsolute = isAbsoluteImageUrl(imageUrl);
                                return isAbsolute ? (
                                  <img src={imageUrl} alt={modelName} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  <Image src={imageUrl} alt={modelName} width={300} height={200} className="rounded-xl object-cover" unoptimized />
                                );
                              })()
                            ) : (
                              <Car className="h-12 w-12 text-muted-foreground" />
                            )}
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <GitCompare className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-lg">{modelName}</CardTitle>
                          <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold">${(vehicle.msrp || 0).toLocaleString()}</span>
                            <Button
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  handleRemoveVehicle(vehicle._id);
                                } else {
                                  handleAddVehicle(vehicle._id);
                                }
                              }}
                            >
                              {isSelected ? 'Remove' : 'Add'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    }>
      <CompareContent />
    </Suspense>
  );
}

