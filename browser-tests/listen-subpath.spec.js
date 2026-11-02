const {test,expect}=require('@playwright/test');

test('model and catalog load under a GitHub Pages style subpath',async({page})=>{
  test.setTimeout(120000);
  await page.route('**/jazz-footprints/**',async route=>{
    const original=new URL(route.request().url());
    const local=new URL(original);
    local.pathname=original.pathname.replace(/^\/jazz-footprints(?=\/)/,'');
    const response=await route.fetch({url:local.href});
    await route.fulfill({response});
  });
  await page.goto('/jazz-footprints/');
  await page.locator('#landing-prompt').click();
  await page.locator('#open-listen').click();
  await page.locator('#listen-example').click();
  await expect(page.locator('.listen-result').first()).toContainText('Paul Desmond',{timeout:90000});
});
