import Leverade from '../lib/leverade';
import { LeveradeLicense } from '../lib/leverade/types';

const leverade = new Leverade();

const run = async () => {
  await leverade.initialise();
  // USAGE: Set the parameters here.
  await setLicensesExpirationDate(6717, 'player', '2024-06-30');
};

const setLicensesExpirationDate = async (
  seasonId: number,
  type: string,
  newExpirationDate: string,
  options: { eraseExisting: boolean } = { eraseExisting: false }
) => {
  const responseContent = await leverade.sendRequest<LeveradeLicense>('licenses', {
    filter: `season.id:${seasonId},type:${type}`,
    pageNumber: 1,
    pageSize: 500,
  });
  const licenses = responseContent.data;
  for (const license of licenses) {
    if (!options.eraseExisting && license.attributes.expiration) {
      console.log(`License ${license.id} already has an expiration date`);
    } else {
      const body = {
        data: {
          type: 'license',
          id: license.id.toString(),
          attributes: {
            expiration: newExpirationDate,
          },
        },
      };
      // USAGE: Uncomment below to enable the script
      // await leverade.sendRequest(`licenses/${license.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(body),
      // });
      // console.log(`License ${license.id} got its expiration date set to ${newExpirationDate}`);
    }
  }
};

run();
