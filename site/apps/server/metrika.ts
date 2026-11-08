// Shared by static publishing and public SSR. Local previews never send visits.
export const metrikaHead = `<!-- Yandex.Metrika counter -->
<script type="text/javascript">
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=114134772', 'ym');
ym(114134772, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
</script><!-- /Yandex.Metrika counter -->`;

export const metrikaBody = `<noscript><div><img src="https://mc.yandex.ru/watch/114134772" style="position:absolute; left:-9999px;" alt="" /></div></noscript>`;

export function withMetrika(template: string, publicSite: boolean): string {
  return template
    .replace("<!--analytics-head-->", publicSite ? metrikaHead : "")
    .replace("<!--analytics-body-->", publicSite ? metrikaBody : "");
}
