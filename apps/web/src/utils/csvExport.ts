import { Observation } from '../types/observation';

export function exportToCSV(
  observations: Observation[],
  filename: string = 'waterways-observations.csv'
) {
  const headers = [
    'ID',
    'Project Name',
    'Journey Start Location',
    'Location Name',
    'Latitude',
    'Longitude',
    'Date',
    'Time',
    'Observation Type',
    'Observation',
    'Observer Name',
    'Keywords',
    'Number of Photos',
    'Number of Videos',
  ];

  const rows = observations.map((obs) => [
    obs.id,
    obs.projectName,
    obs.journeyStartLocation,
    obs.location.name,
    obs.location.lat.toString(),
    obs.location.lng.toString(),
    obs.date,
    obs.timestamp,
    obs.type,
    obs.observation,
    obs.observerName,
    obs.keywords.join('; '),
    obs.photos.length.toString(),
    obs.videos.length.toString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
