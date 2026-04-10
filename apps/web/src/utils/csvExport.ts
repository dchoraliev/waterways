import { Observation } from '../types/observation';

export function exportToCSV(
  observations: Observation[],
  filename: string = 'waterways-observations.csv'
) {
  const headers = [
    'ID',
    'Project Name',
    'Latitude',
    'Longitude',
    'Date',
    'Time',
    'Category',
    'Description',
    'Observer Name',
    'Keywords',
    'Photo URLs',
    'Video URLs',
  ];

  const rows = observations.map((obs) => {
    const photoUrls = obs.photos.length > 0 ? obs.photos.join(' | ') : '';
    const videoUrls = obs.videos.length > 0 ? obs.videos.join(' | ') : '';

    return [
      obs.id,
      obs.projectName,
      obs.location.lat.toString(),
      obs.location.lng.toString(),
      obs.date,
      obs.timestamp,
      obs.type,
      obs.observation,
      obs.observerName,
      obs.keywords.join('; '),
      photoUrls,
      videoUrls,
    ];
  });

  // Add BOM for UTF-8 encoding to help Excel recognize column widths
  const bom = '\uFEFF';
  const csvContent =
    bom +
    [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

  const blob = new globalThis.Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = globalThis.URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
