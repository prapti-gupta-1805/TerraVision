// Street view locations with before/after images
export interface StreetViewLocation {
  id: string;
  name: string;
  coords: [number, number];
  beforeImage: string;
  afterImage: string;
  description: string;
  category: 'tree' | 'solar' | 'corridor' | 'shade' | 'mixed';
}

export const STREET_VIEW_LOCATIONS: StreetViewLocation[] = [
  {
    id: 'location-1',
    name: 'Connaught Place',
    coords: [28.6315, 77.2167],
    beforeImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2b85fZA5ZhSV6ALnmH30gWhXPINZbMos-K8l5CDdeWBVzy-Cen78tC8z0bldCnYH56qHqYRb2LpS054_J_1g2tf5VVmgsFBR_v3qHrftKh8Yp_2W1ZAwJeklFJV3VSNIK6MuigHWnd0ZRTRDA4HR6BdryKYeXPKLFfvKBKDXsNcoWxNpMBymVNu_Kh114iJOmuDDREOelF4Z_0UGUM0JLUOcC6g-vL-m5x2u8lVtvF0_7EpJxPbLzy3TbACE0n9R66E6f-sVxMg',
    afterImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHMrif_FZz6MFxzgYOs8DkUKUMy1kgjRQlm0dsWSV2e3KvCAUsz8bwUcLu3V1swB9_heMVTDwKKosK57c4CdW-b9hO3CAQQ7N4AKl5GxC-d0baLGi--UG91c-w2zt6qfjZxsFhuyWgaopmRJCYHs0sRM7i0pyiYNK-SCJbfwSUa7JVoE64VQsX3KpJ8ssuwg62YOxCLtBlHYN-u1okLrP9vomNTnLpdg3QA4scmcKd-ibGfMELIKDv2XzlxpRFEDgbueLBqX9J7A',
    description: 'Urban green transformation with added trees and vegetation',
    category: 'tree'
  },
  {
    id: 'location-2',
    name: 'Rajpath Boulevard',
    coords: [28.6143, 77.2050],
    beforeImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2b85fZA5ZhSV6ALnmH30gWhXPINZbMos-K8l5CDdeWBVzy-Cen78tC8z0bldCnYH56qHqYRb2LpS054_J_1g2tf5VVmgsFBR_v3qHrftKh8Yp_2W1ZAwJeklFJV3VSNIK6MuigHWnd0ZRTRDA4HR6BdryKYeXPKLFfvKBKDXsNcoWxNpMBymVNu_Kh114iJOmuDDREOelF4Z_0UGUM0JLUOcC6g-vL-m5x2u8lVtvF0_7EpJxPbLzy3TbACE0n9R66E6f-sVxMg',
    afterImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHMrif_FZz6MFxzgYOs8DkUKUMy1kgjRQlm0dsWSV2e3KvCAUsz8bwUcLu3V1swB9_heMVTDwKKosK57c4CdW-b9hO3CAQQ7N4AKl5GxC-d0baLGi--UG91c-w2zt6qfjZxsFhuyWgaopmRJCYHs0sRM7i0pyiYNK-SCJbfwSUa7JVoE64VQsX3KpJ8ssuwg62YOxCLtBlHYN-u1okLrP9vomNTnLpdg3QA4scmcKd-ibGfMELIKDv2XzlxpRFEDgbueLBqX9J7A',
    description: 'Green corridor with solar panels and shade structures',
    category: 'corridor'
  },
  {
    id: 'location-3',
    name: 'Karol Bagh Market',
    coords: [28.6520, 77.1900],
    beforeImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2b85fZA5ZhSV6ALnmH30gWhXPINZbMos-K8l5CDdeWBVzy-Cen78tC8z0bldCnYH56qHqYRb2LpS054_J_1g2tf5VVmgsFBR_v3qHrftKh8Yp_2W1ZAwJeklFJV3VSNIK6MuigHWnd0ZRTRDA4HR6BdryKYeXPKLFfvKBKDXsNcoWxNpMBymVNu_Kh114iJOmuDDREOelF4Z_0UGUM0JLUOcC6g-vL-m5x2u8lVtvF0_7EpJxPbLzy3TbACE0n9R66E6f-sVxMg',
    afterImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHMrif_FZz6MFxzgYOs8DkUKUMy1kgjRQlm0dsWSV2e3KvCAUsz8bwUcLu3V1swB9_heMVTDwKKosK57c4CdW-b9hO3CAQQ7N4AKl5GxC-d0baLGi--UG91c-w2zt6qfjZxsFhuyWgaopmRJCYHs0sRM7i0pyiYNK-SCJbfwSUa7JVoE64VQsX3KpJ8ssuwg62YOxCLtBlHYN-u1okLrP9vomNTnLpdg3QA4scmcKd-ibGfMELIKDv2XzlxpRFEDgbueLBqX9J7A',
    description: 'Solar-powered street with rooftop installations',
    category: 'solar'
  },
  {
    id: 'location-4',
    name: 'Nehru Park Area',
    coords: [28.6095, 77.2020],
    beforeImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2b85fZA5ZhSV6ALnmH30gWhXPINZbMos-K8l5CDdeWBVzy-Cen78tC8z0bldCnYH56qHqYRb2LpS054_J_1g2tf5VVmgsFBR_v3qHrftKh8Yp_2W1ZAwJeklFJV3VSNIK6MuigHWnd0ZRTRDA4HR6BdryKYeXPKLFfvKBKDXsNcoWxNpMBymVNu_Kh114iJOmuDDREOelF4Z_0UGUM0JLUOcC6g-vL-m5x2u8lVtvF0_7EpJxPbLzy3TbACE0n9R66E6f-sVxMg',
    afterImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHMrif_FZz6MFxzgYOs8DkUKUMy1kgjRQlm0dsWSV2e3KvCAUsz8bwUcLu3V1swB9_heMVTDwKKosK57c4CdW-b9hO3CAQQ7N4AKl5GxC-d0baLGi--UG91c-w2zt6qfjZxsFhuyWgaopmRJCYHs0sRM7i0pyiYNK-SCJbfwSUa7JVoE64VQsX3KpJ8ssuwg62YOxCLtBlHYN-u1okLrP9vomNTnLpdg3QA4scmcKd-ibGfMELIKDv2XzlxpRFEDgbueLBqX9J7A',
    description: 'Enhanced shade coverage with modern canopy structures',
    category: 'shade'
  },
  {
    id: 'location-5',
    name: 'ITO Intersection',
    coords: [28.6280, 77.2410],
    beforeImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2b85fZA5ZhSV6ALnmH30gWhXPINZbMos-K8l5CDdeWBVzy-Cen78tC8z0bldCnYH56qHqYRb2LpS054_J_1g2tf5VVmgsFBR_v3qHrftKh8Yp_2W1ZAwJeklFJV3VSNIK6MuigHWnd0ZRTRDA4HR6BdryKYeXPKLFfvKBKDXsNcoWxNpMBymVNu_Kh114iJOmuDDREOelF4Z_0UGUM0JLUOcC6g-vL-m5x2u8lVtvF0_7EpJxPbLzy3TbACE0n9R66E6f-sVxMg',
    afterImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHMrif_FZz6MFxzgYOs8DkUKUMy1kgjRQlm0dsWSV2e3KvCAUsz8bwUcLu3V1swB9_heMVTDwKKosK57c4CdW-b9hO3CAQQ7N4AKl5GxC-d0baLGi--UG91c-w2zt6qfjZxsFhuyWgaopmRJCYHs0sRM7i0pyiYNK-SCJbfwSUa7JVoE64VQsX3KpJ8ssuwg62YOxCLtBlHYN-u1okLrP9vomNTnLpdg3QA4scmcKd-ibGfMELIKDv2XzlxpRFEDgbueLBqX9J7A',
    description: 'Comprehensive transformation with trees, solar, and green corridors',
    category: 'mixed'
  },
  {
    id: 'location-6',
    name: 'Janpath Street',
    coords: [28.6230, 77.2150],
    beforeImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2b85fZA5ZhSV6ALnmH30gWhXPINZbMos-K8l5CDdeWBVzy-Cen78tC8z0bldCnYH56qHqYRb2LpS054_J_1g2tf5VVmgsFBR_v3qHrftKh8Yp_2W1ZAwJeklFJV3VSNIK6MuigHWnd0ZRTRDA4HR6BdryKYeXPKLFfvKBKDXsNcoWxNpMBymVNu_Kh114iJOmuDDREOelF4Z_0UGUM0JLUOcC6g-vL-m5x2u8lVtvF0_7EpJxPbLzy3TbACE0n9R66E6f-sVxMg',
    afterImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHMrif_FZz6MFxzgYOs8DkUKUMy1kgjRQlm0dsWSV2e3KvCAUsz8bwUcLu3V1swB9_heMVTDwKKosK57c4CdW-b9hO3CAQQ7N4AKl5GxC-d0baLGi--UG91c-w2zt6qfjZxsFhuyWgaopmRJCYHs0sRM7i0pyiYNK-SCJbfwSUa7JVoE64VQsX3KpJ8ssuwg62YOxCLtBlHYN-u1okLrP9vomNTnLpdg3QA4scmcKd-ibGfMELIKDv2XzlxpRFEDgbueLBqX9J7A',
    description: 'Urban greenery enhancement with tree cover',
    category: 'tree'
  }
];

// Helper function to get locations by active layers
export function getStreetViewLocationsByLayers(activeLayers: string[]): StreetViewLocation[] {
  if (activeLayers.length === 0) return STREET_VIEW_LOCATIONS;
  
  return STREET_VIEW_LOCATIONS.filter(location => {
    // If corridor is active, show corridor and mixed
    if (activeLayers.includes('corridor') && (location.category === 'corridor' || location.category === 'mixed')) {
      return true;
    }
    // If tree is active, show tree locations
    if (activeLayers.includes('tree') && location.category === 'tree') {
      return true;
    }
    // If solar is active, show solar locations
    if (activeLayers.includes('solar') && (location.category === 'solar' || location.category === 'mixed')) {
      return true;
    }
    // If shade is active, show shade locations
    if (activeLayers.includes('shade') && location.category === 'shade') {
      return true;
    }
    return false;
  });
}
