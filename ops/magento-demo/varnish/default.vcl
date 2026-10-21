vcl 4.1;
backend default {
    .host = "nginx";
    .port = "80";
    .first_byte_timeout = 600s;
}
# Installation bootstrap only. Replaced by Magento's generated VCL by install.sh.
sub vcl_recv {
    return (pass);
}
