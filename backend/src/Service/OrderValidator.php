<?php

declare(strict_types=1);

namespace App\Service;

final class OrderValidator
{
    public function validate(array $input): array
    {
        $string = static function (string $key, int $max, bool $required = false) use ($input): ?string {
            $value = $input[$key] ?? null;
            if (null === $value && !$required) {
                return null;
            }
            if (!is_string($value) || strlen(trim($value)) > $max || ($required && '' === trim($value))) {
                throw new \InvalidArgumentException('Invalid '.$key);
            }

            return '' === trim($value) ? null : trim($value);
        };
        $name = $string('customer_name', 200, true);
        $email = $string('email', 254, true);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)) {
            throw new \InvalidArgumentException('Invalid email');
        }
        $website = $string('website', 2048);
        if (null !== $website && (!filter_var($website, FILTER_VALIDATE_URL) || !in_array(parse_url($website, PHP_URL_SCHEME), ['http', 'https'], true))) {
            throw new \InvalidArgumentException('Website must be an http or https URL');
        }
        $uuid = (static fn (?string $value): bool => null !== $value && 1 === preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value));
        $service = $string('service_id', 36, true);
        $extension = $string('extension_id', 36);
        if (!$uuid($service) || (null !== $extension && !$uuid($extension))) {
            throw new \InvalidArgumentException('Invalid service or extension');
        }

        return ['customer_name' => $name, 'email' => strtolower($email), 'website' => $website,
            'notes' => $string('notes', 10000), 'service_id' => $service, 'extension_id' => $extension];
    }
}
