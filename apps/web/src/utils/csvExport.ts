import { Observation } from '../types/observation';

type LegendCategory = {
  name: string;
  color: string;
  keywords: string[];
};

export function exportToCSV(
  observations: Observation[],
  categories: LegendCategory[],
  filename: string = 'waterways-observations.csv'
) {
  const headers = [
    'Observation ID',
    'Project Name',
    'Journey Id',
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

    const matchedCategory = categories.find((cat) => cat.name === obs.type);

    const matchedKeywords = matchedCategory
      ? matchedCategory.keywords.filter((kw) =>
          obs.observation.toLowerCase().includes(kw.toLowerCase())
        )
      : [];

    return [
      obs.id,
      obs.projectName,
      obs.tripId ?? '',
      obs.location.lat.toString(),
      obs.location.lng.toString(),
      obs.date,
      obs.timestamp,
      matchedCategory?.name ?? obs.type,
      obs.observation,
      obs.observerName,
      matchedKeywords.join('; '),
      photoUrls,
      videoUrls,
    ];
  });

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
