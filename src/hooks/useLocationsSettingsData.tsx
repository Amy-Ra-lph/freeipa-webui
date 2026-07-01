import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useLocationShowQuery } from "src/services/rpcLocations";
// Data types
import { Location, Metadata } from "src/utils/datatypes/globalDataTypes";

type LocationSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalLocation: Partial<Location>;
  location: Partial<Location>;
  setLocation: (location: Partial<Location>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<Location>;
};

const useLocationSettings = (locationId: string): LocationSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Location
  const locationQuery = useLocationShowQuery(locationId);
  const locationData = locationQuery.data;
  const isLocationLoading = locationQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [location, setLocation] = useState<Partial<Location>>({});
  const [originalLocation, setOriginalLocation] = useState<Partial<Location>>(
    {}
  );

  useEffect(() => {
    if (locationData && locationData.length > 0 && !locationQuery.isFetching) {
      setLocation({ ...locationData[0] });
      setOriginalLocation({ ...locationData[0] });
    }
  }, [locationData, locationQuery.isFetching]);

  const getModifiedValues = (): Partial<Location> => {
    if (!originalLocation) {
      return {};
    }

    const modifiedValues: Partial<Location> = {};
    for (const [key, value] of Object.entries(location)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalLocation[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (originalLocation[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalLocation) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(location)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalLocation[key]) !== JSON.stringify(value)) {
          isModified = true;
          break;
        }
      } else {
        if (originalLocation[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [location, originalLocation]);

  const onResetValues = () => {
    setOriginalLocation({ ...location });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isLocationLoading,
    isFetching: locationQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalLocation,
    location,
    setLocation,
    refetch: locationQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useLocationSettings };
